import { NextRequest, NextResponse } from "next/server";
import {
  createPyrusTaskReview,
  getPyrusTaskId,
  updatePyrusTaskReview,
  type HomeHelperBpmsTask,
} from "@/lib/pyrus";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const taskId = typeof body?.taskId === "string" ? body.taskId : "";

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Profile is not onboarded" }, { status: 400 });
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, description, status, points, deadline, family_id, assigned_to, created_by, photo_proof_url, pyrus_task_id")
    .eq("id", taskId)
    .eq("family_id", profile.family_id)
    .maybeSingle();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [{ data: family }, { data: child }, { data: parent }] = await Promise.all([
    supabase
      .from("families")
      .select("id, name")
      .eq("id", task.family_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, email, first_name")
      .eq("id", task.assigned_to)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, email, first_name")
      .eq("id", task.created_by)
      .maybeSingle(),
  ]);

  let proofUrl = task.photo_proof_url;
  if (task.photo_proof_url) {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.storage
      .from("task-proofs")
      .createSignedUrl(task.photo_proof_url, 60 * 60 * 24 * 7);
    proofUrl = data?.signedUrl ?? task.photo_proof_url;
  }

  const bpmsStatus: HomeHelperBpmsTask["status"] =
    task.status === "completed" || task.status === "approved"
      ? "approved"
      : task.status === "rejected" || task.status === "needs_fix"
        ? "needs_fix"
        : task.status === "in_review"
          ? "in_review"
          : "pending";

  const payload: HomeHelperBpmsTask = {
    taskId: task.id,
    title: task.title,
    description: task.description,
    status: bpmsStatus,
    points: task.points,
    deadline: task.deadline,
    familyId: task.family_id,
    familyName: family?.name,
    childId: task.assigned_to,
    childName: child?.first_name,
    childEmail: child?.email,
    parentId: task.created_by,
    parentName: parent?.first_name,
    parentEmail: parent?.email,
    proofUrl,
  };

  const result = task.pyrus_task_id
    ? await updatePyrusTaskReview(task.pyrus_task_id, payload)
    : await createPyrusTaskReview(payload);

  const pyrusTaskId = getPyrusTaskId(result);
  if (pyrusTaskId && !task.pyrus_task_id) {
    const adminSupabase = createAdminClient();
    await adminSupabase
      .from("tasks")
      .update({ pyrus_task_id: pyrusTaskId })
      .eq("id", task.id);
  }

  if ("skipped" in result && result.skipped) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
