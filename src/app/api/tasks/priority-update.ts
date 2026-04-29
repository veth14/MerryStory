import type { WithId, Document } from "mongodb";

export type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function normalizeTaskStatus(value?: string | null) {
  const normalized = (value || "").toUpperCase().replace(/[_-]/g, " ").trim();
  if (normalized === "DONE" || normalized === "COMPLETE" || normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "TODO") return "TO DO";
  if (normalized === "INPROGRESS") return "IN PROGRESS";
  return normalized;
}

export function normalizeTaskPriority(value?: string | null): TaskPriority {
  const normalized = (value || "").toUpperCase().replace(/[_-]/g, " ").trim();
  if (normalized === "CRITICAL") return "CRITICAL";
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "MEDIUM") return "MEDIUM";
  return "LOW";
}

export function resolveTaskDueAt(task: WithId<Document>) {
  const dueDate = typeof task?.due?.date === "string" ? task.due.date.trim() : "";
  const dueTime = typeof task?.due?.time === "string" ? task.due.time.trim() : "";

  if (!dueDate) return null;

  const dueAt = new Date(`${dueDate}T${dueTime || "23:59"}:00`);
  if (Number.isNaN(dueAt.getTime())) return null;

  return dueAt;
}

export function getComputedPriorityForTask(task: WithId<Document>, now = new Date()): TaskPriority | null {
  if (normalizeTaskStatus(typeof task.status === "string" ? task.status : "") === "COMPLETED") {
    return null;
  }

  const dueAt = resolveTaskDueAt(task);
  if (!dueAt) return null;

  if (dueAt.getTime() < now.getTime()) {
    return "CRITICAL";
  }

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (dueAt.getTime() <= endOfToday.getTime()) {
    return "HIGH";
  }

  const oneWeekFromNow = new Date(now);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  if (dueAt.getTime() <= oneWeekFromNow.getTime()) {
    return "MEDIUM";
  }

  return "LOW";
}

export function shouldUpgradePriority(current: string | null | undefined, next: TaskPriority) {
  const currentPriority = normalizeTaskPriority(current);
  return PRIORITY_RANK[currentPriority] < PRIORITY_RANK[next];
}
