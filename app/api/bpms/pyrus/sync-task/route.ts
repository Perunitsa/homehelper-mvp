import { NextRequest, NextResponse } from "next/server";
import { createPyrusTaskReview } from "@/lib/pyrus";
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
    .select("id, title, description, status, points, deadline, family_id, assigned_to, created_by, photo_proof_url")
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
    const { data } = await supabase.storage
      .from("task-proofs")
      .createSignedUrl(task.photo_proof_url, 60 * 60 * 24 * 7);
    proofUrl = data?.signedUrl ?? task.photo_proof_url;
  }

  const result = await createPyrusTaskReview({
    taskId: task.id,
    title: task.title,
    description: task.description,
    status: task.status === "completed" || task.status === "rejected"
      ? task.status
      : "in_review",
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
  });

  if ("skipped" in result && result.skipped) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
