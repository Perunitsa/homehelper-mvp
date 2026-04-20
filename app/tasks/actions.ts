"use server";

import { redirect } from "next/navigation";
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

  const { error } = await supabase.from("tasks").insert({
    family_id: profile.family_id,
    title,
    description: description || null,
    assigned_to: assignedTo,
    created_by: user.id,
    points,
    deadline,
    icon,
  });

  if (error) {
    console.error("createTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
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

  let photoProofUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const objectPath = `${taskId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("task-proofs")
      .upload(objectPath, file, { upsert: true });

    if (uploadError) {
      console.error("submitTaskAction upload:", uploadError);
      redirect(`/tasks?error=${encodeURIComponent(uploadError.message)}`);
    }

    photoProofUrl = objectPath;
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "in_review",
      photo_proof_url: photoProofUrl,
    })
    .eq("id", taskId)
    .eq("assigned_to", user.id);

  if (error) {
    console.error("submitTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
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
    redirect("/tasks?error=Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ");
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, family_id, status, points, assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    console.error("approveTaskAction select task:", taskError);
    redirect(`/tasks?error=${encodeURIComponent(taskError.message)}`);
  }

  if (!task || task.family_id !== profile.family_id) {
    redirect("/tasks?error=Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°");
  }

  if (task.status !== "in_review") {
    redirect("/tasks?error=Р—Р°РґР°С‡Р° РЅРµ РЅР° РїСЂРѕРІРµСЂРєРµ");
  }

  const completedAt = new Date().toISOString();

  const { error: updateTaskError } = await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: completedAt })
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

  redirect("/tasks");
}

export async function rejectTaskAction(formData: FormData) {
  const taskId = getString(formData, "taskId");
  const reason = getString(formData, "reason");
  if (!taskId) {
    redirect("/tasks?error=Не найден ID задачи");
  }

  const { supabase } = await getSession();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "rejected",
      description: reason ? `${reason}` : undefined,
    })
    .eq("id", taskId);

  if (error) {
    console.error("rejectTaskAction:", error);
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/tasks");
}
