"use server";

import { redirect } from "next/navigation";
import {
  createPyrusTaskReview,
  getPyrusTaskId,
  updatePyrusTaskReview,
  type HomeHelperBpmsTask,
} from "@/lib/pyrus";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, family_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.family_id) {
    redirect("/onboarding");
  }

  return { supabase, user, profile };
}

type TaskForPyrus = {
  id: string;
  title: string;
  description?: string | null;
  status: HomeHelperBpmsTask["status"];
  points?: number | null;
  deadline?: string | null;
  family_id: string;
  assigned_to: string;
  created_by: string;
  photo_proof_url?: string | null;
  pyrus_task_id?: number | null;
};

async function syncTaskWithPyrus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  task: TaskForPyrus,
  status: HomeHelperBpmsTask["status"],
  proofUrl?: string | null,
) {
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

  const payload: HomeHelperBpmsTask = {
    taskId: task.id,
    title: task.title,
    description: task.description,
    status,
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

  if (result.skipped) {
    return null;
  }

  if (!result.ok) {
    return result.error;
  }

  const pyrusTaskId = getPyrusTaskId(result);
  if (pyrusTaskId && !task.pyrus_task_id) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("tasks")
      .update({ pyrus_task_id: pyrusTaskId })
      .eq("id", task.id);

    if (error) {
      return error.message;
    }
  }

  return null;
}

export async function createTaskAction(formData: FormData) {
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const assignedTo = getString(formData, "assignedTo");
  const points = getNumber(formData, "points");
  const deadlineRaw = getString(formData, "deadline");
  const icon = getString(formData, "icon") || "quest";

  if (!title || !assignedTo || !points) {
    redirect("/tasks?error=Заполните название, исполнителя и награду");
  }

  const { supabase, user, profile } = await getSession();

  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      family_id: profile.family_id,
      title,
      description: description || null,
      assigned_to: assignedTo,
      created_by: user.id,
      points,
      deadline,
      icon,
      status: "pending",
    })
    .select("id, title, description, status, points, deadline, family_id, assigned_to, created_by, photo_proof_url, pyrus_task_id")
    .single();

  if (error) {
    console.error("createTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  if (task) {
    const pyrusError = await syncTaskWithPyrus(
      supabase,
      { ...task, status: "pending" },
      "pending",
      null,
    );

    if (pyrusError) {
      redirect(`/tasks?error=${encodeURIComponent(`Pyrus: ${pyrusError}`)}`);
    }
  }

  redirect("/tasks");
}

export async function submitTaskAction(formData: FormData) {
  const taskId = getString(formData, "taskId");
  const file = formData.get("proof");

  if (!taskId) {
    redirect("/tasks?error=Не найден ID задачи");
  }

  const { supabase, user } = await getSession();

  if (!(file instanceof File) || file.size === 0) {
    redirect("/tasks?error=Прикрепите фото-доказательство");
  }

  if (!file.type.startsWith("image/")) {
    redirect("/tasks?error=Доказательство должно быть картинкой или фотографией");
  }

  const maxProofSize = 10 * 1024 * 1024;
  if (file.size > maxProofSize) {
    redirect("/tasks?error=Фото-доказательство должно быть не больше 10 МБ");
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "proof.jpg";
  const objectPath = `${taskId}/${Date.now()}-${safeName}`;
  const adminSupabase = createAdminClient();
  const { error: uploadError } = await adminSupabase.storage
    .from("task-proofs")
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("submitTaskAction upload:", uploadError);
    redirect(`/tasks?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "in_review",
      photo_proof_url: objectPath,
    })
    .eq("id", taskId)
    .eq("assigned_to", user.id);

  if (error) {
    console.error("submitTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, description, status, points, deadline, family_id, assigned_to, created_by, photo_proof_url, pyrus_task_id")
    .eq("id", taskId)
    .maybeSingle();

  if (task) {
    let proofUrl = task.photo_proof_url;
    if (task.photo_proof_url) {
      const { data } = await adminSupabase.storage
        .from("task-proofs")
        .createSignedUrl(task.photo_proof_url, 60 * 60 * 24 * 7);
      proofUrl = data?.signedUrl ?? task.photo_proof_url;
    }

    let pyrusError: string | null = null;

    try {
      pyrusError = await syncTaskWithPyrus(
        supabase,
        { ...task, status: "in_review" },
        "in_review",
        proofUrl,
      );
    } catch (syncError) {
      console.warn("Pyrus BPMS sync threw an error:", syncError);
      pyrusError = syncError instanceof Error
        ? syncError.message
        : "Pyrus BPMS sync failed";
    }

    if (pyrusError) {
      redirect(`/tasks?error=${encodeURIComponent(`Pyrus: ${pyrusError}`)}`);
    }
  }

  redirect("/tasks");
}

export async function approveTaskAction(formData: FormData) {
  const taskId = getString(formData, "taskId");
  if (!taskId) {
    redirect("/tasks?error=Не найден ID задачи");
  }

  const { supabase, profile } = await getSession();
  if (profile.role !== "parent") {
    redirect("/tasks?error=Доступ запрещён");
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, description, family_id, status, points, deadline, assigned_to, created_by, photo_proof_url, pyrus_task_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    console.error("approveTaskAction select task:", taskError);
    redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
  }

  if (!task || task.family_id !== profile.family_id) {
    redirect("/tasks?error=Задача не найдена");
  }

  if (task.status !== "in_review") {
    redirect("/tasks?error=Задача не на проверке");
  }

  const completedAt = new Date().toISOString();

  const { error: updateTaskError } = await supabase
    .from("tasks")
    .update({ status: "approved", completed_at: completedAt })
    .eq("id", taskId);

  if (updateTaskError) {
    console.error("approveTaskAction update task:", updateTaskError);
    redirect(`/tasks?error=${encodeURIComponent(updateTaskError.message)}`);
  }

  const { data: assignee, error: assigneeError } = await supabase
    .from("profiles")
    .select("id, current_xp, level")
    .eq("id", task.assigned_to)
    .maybeSingle();

  if (assigneeError) {
    console.error("approveTaskAction select assignee:", assigneeError);
    redirect(`/tasks?error=${encodeURIComponent(assigneeError.message)}`);
  }

  const xpForLevel = 100;
  const currentXp = assignee?.current_xp ?? 0;
  const nextXp = currentXp + (task.points ?? 0);
  const nextLevel = Math.floor(nextXp / xpForLevel) + 1;

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ current_xp: nextXp, level: nextLevel })
    .eq("id", task.assigned_to);

  if (updateProfileError) {
    console.error("approveTaskAction update profile:", updateProfileError);
    redirect(`/tasks?error=${encodeURIComponent(updateProfileError.message)}`);
  }

  const { error: badgeErr } = await supabase.from("achievement_events").insert({
    user_id: task.assigned_to,
    title: `Completed: ${task.id.slice(0, 6)}`,
    icon: "sparkles",
  });
  if (badgeErr) {
    console.warn("approveTaskAction insert achievement_events:", badgeErr);
  }

  // Уведомление исполнителю о подтверждении (US-02 в демо-виде: in-app notifications).
  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: task.assigned_to,
    type: "task",
    title: "Квест подтверждён",
    message: `Начислено ${task.points ?? 0} XP`,
  });
  if (notifErr) {
    console.warn("approveTaskAction insert notification:", notifErr);
  }

  let proofUrl = task.photo_proof_url;
  if (task.photo_proof_url) {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.storage
      .from("task-proofs")
      .createSignedUrl(task.photo_proof_url, 60 * 60 * 24 * 7);
    proofUrl = data?.signedUrl ?? task.photo_proof_url;
  }

  const pyrusError = await syncTaskWithPyrus(
    supabase,
    { ...task, status: "approved" },
    "approved",
    proofUrl,
  );

  if (pyrusError) {
    redirect(`/tasks?error=${encodeURIComponent(`Pyrus: ${pyrusError}`)}`);
  }

  redirect("/tasks");
}

export async function rejectTaskAction(formData: FormData) {
  const taskId = getString(formData, "taskId");
  const reason = getString(formData, "reason");
  if (!taskId) {
    redirect("/tasks?error=Не найден ID задачи");
  }

  const { supabase, profile } = await getSession();
  if (profile.role !== "parent") {
    redirect("/tasks?error=Access denied");
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, description, family_id, status, points, deadline, assigned_to, created_by, photo_proof_url, pyrus_task_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    console.error("rejectTaskAction select task:", taskError);
    redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
  }

  if (!task || task.family_id !== profile.family_id) {
    redirect("/tasks?error=Task not found");
  }

  if (task.status !== "in_review") {
    redirect("/tasks?error=Task is not in review");
  }
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "needs_fix",
      description: reason ? `${reason}` : undefined,
    })
    .eq("id", taskId);

  if (error) {
    console.error("rejectTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  let proofUrl = task.photo_proof_url;
  if (task.photo_proof_url) {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.storage
      .from("task-proofs")
      .createSignedUrl(task.photo_proof_url, 60 * 60 * 24 * 7);
    proofUrl = data?.signedUrl ?? task.photo_proof_url;
  }

  const pyrusError = await syncTaskWithPyrus(
    supabase,
    {
      ...task,
      description: reason || task.description,
      status: "needs_fix",
    },
    "needs_fix",
    proofUrl,
  );

  if (pyrusError) {
    redirect(`/tasks?error=${encodeURIComponent(`Pyrus: ${pyrusError}`)}`);
  }

  redirect("/tasks");
}
