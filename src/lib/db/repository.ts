import { db, DEFAULT_SETTINGS } from "./index";
import type {
  Task,
  Routine,
  SessionTemplate,
  ScheduleRule,
  ScheduledSession,
  Completion,
  Goal,
  UserSettings,
  ChangeLogEntry,
} from "./types";
import { generateId, toISODate } from "../i18n/format";
import { syncScheduleForDateRange } from "./scheduleGenerator";

// --- SETTINGS ---
export async function getSettings(): Promise<UserSettings> {
  const settings = await db.settings.get("current");
  if (!settings) {
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated: UserSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.settings.put(updated);
  return updated;
}

// --- TASKS ---
export async function getTasks(includeDeleted = false): Promise<Task[]> {
  const all = await db.tasks.toArray();
  if (includeDeleted) return all;
  return all.filter((t) => !t.deletedAt);
}

export async function createTask(data: {
  title: string;
  notes?: string;
  dueDate?: string | null;
  areaId?: string | null;
  goalId?: string | null;
  pinnedToday?: boolean;
}): Promise<Task> {
  const task: Task = {
    id: generateId(),
    title: data.title.trim(),
    notes: data.notes?.trim() || undefined,
    dueDate: data.dueDate || null,
    areaId: data.areaId || null,
    goalId: data.goalId || null,
    pinnedToday: data.pinnedToday ?? false,
    doneAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.tasks.add(task);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await db.tasks.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleTaskComplete(id: string): Promise<boolean> {
  const task = await db.tasks.get(id);
  if (!task) return false;

  const isDone = !task.doneAt;
  const now = new Date().toISOString();

  await db.tasks.update(id, {
    doneAt: isDone ? now : null,
    updatedAt: now,
  });

  if (isDone) {
    // Record completion
    const completion: Completion = {
      id: generateId(),
      taskId: id,
      status: "done",
      completedAt: now,
      createdAt: now,
    };
    await db.completions.add(completion);
    await logChange("complete_task", { taskId: id, completionId: completion.id });
  } else {
    // Remove completion record if unmarked
    const comp = await db.completions.where("taskId").equals(id).first();
    if (comp) {
      await db.completions.delete(comp.id);
    }
  }

  return isDone;
}

export async function deleteTask(id: string, permanent = false): Promise<void> {
  if (permanent) {
    await db.tasks.delete(id);
  } else {
    // Soft delete to 30-day trash
    await db.tasks.update(id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// --- ROUTINES & SESSION TEMPLATES ---
export async function getRoutines(includeArchived = false): Promise<
  (Routine & { templates: SessionTemplate[]; rules: ScheduleRule[] })[]
> {
  const routines = await db.routines.toArray();
  const filtered = includeArchived ? routines : routines.filter((r) => r.status !== "archived");

  const results = [];
  for (const r of filtered) {
    const templates = await db.sessionTemplates.where("routineId").equals(r.id).toArray();
    const rules = await db.scheduleRules.where("routineId").equals(r.id).toArray();
    results.push({ ...r, templates, rules });
  }
  return results;
}

export async function createRoutine(data: {
  name: string;
  notes?: string;
  goalId?: string | null;
  areaId?: string | null;
  scheduleMode?: "fixed" | "flexible";
  weeklyTarget?: number;
  templateName: string;
  defaultMinutes?: number;
  tinyMinutes?: number;
  days?: number[]; // e.g. [1, 2, 3, 4, 5]
  startTime?: string | null;
}): Promise<Routine> {
  const now = new Date().toISOString();
  const routineId = generateId();
  const templateId = generateId();
  const ruleId = generateId();

  const routine: Routine = {
    id: routineId,
    name: data.name.trim(),
    notes: data.notes?.trim() || undefined,
    goalId: data.goalId || null,
    areaId: data.areaId || null,
    scheduleMode: data.scheduleMode || "fixed",
    weeklyTarget: data.weeklyTarget || (data.days?.length || 1),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const template: SessionTemplate = {
    id: templateId,
    routineId,
    name: data.templateName.trim() || data.name.trim(),
    defaultMinutes: data.defaultMinutes || 25,
    tinyMinutes: data.tinyMinutes || 5,
    checklist: [],
    createdAt: now,
  };

  const rule: ScheduleRule = {
    id: ruleId,
    templateId,
    routineId,
    days: data.days && data.days.length > 0 ? data.days : [1, 2, 3, 4, 5],
    startTime: data.startTime || null,
    everyNWeeks: 1,
    createdAt: now,
  };

  await db.transaction("rw", [db.routines, db.sessionTemplates, db.scheduleRules], async () => {
    await db.routines.add(routine);
    await db.sessionTemplates.add(template);
    await db.scheduleRules.add(rule);
  });

  // Sync scheduled sessions for the current 2-week window
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  await syncScheduleForDateRange(toISODate(start), toISODate(end));

  return routine;
}

export async function addSessionTemplate(
  routineId: string,
  data: {
    name: string;
    defaultMinutes: number;
    tinyMinutes?: number;
    days?: number[];
    startTime?: string | null;
  }
): Promise<SessionTemplate> {
  const now = new Date().toISOString();
  const templateId = generateId();

  const template: SessionTemplate = {
    id: templateId,
    routineId,
    name: data.name.trim(),
    defaultMinutes: data.defaultMinutes,
    tinyMinutes: data.tinyMinutes || 5,
    checklist: [],
    createdAt: now,
  };

  const rule: ScheduleRule = {
    id: generateId(),
    templateId,
    routineId,
    days: data.days && data.days.length > 0 ? data.days : [1, 3, 5],
    startTime: data.startTime || null,
    everyNWeeks: 1,
    createdAt: now,
  };

  await db.transaction("rw", [db.sessionTemplates, db.scheduleRules], async () => {
    await db.sessionTemplates.add(template);
    await db.scheduleRules.add(rule);
  });

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 3);
  const end = new Date(today);
  end.setDate(today.getDate() + 14);
  await syncScheduleForDateRange(toISODate(start), toISODate(end));

  return template;
}

export async function pauseRoutine(id: string): Promise<void> {
  const r = await db.routines.get(id);
  if (!r) return;
  const newStatus = r.status === "paused" ? "active" : "paused";
  await db.routines.update(id, {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRoutine(id: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.routines, db.sessionTemplates, db.scheduleRules, db.scheduledSessions],
    async () => {
      await db.routines.delete(id);
      await db.sessionTemplates.where("routineId").equals(id).delete();
      await db.scheduleRules.where("routineId").equals(id).delete();
      // Keep completed sessions, remove only planned future ones
      await db.scheduledSessions
        .where("routineId")
        .equals(id)
        .and((s) => s.state === "planned" || s.state === "due_today")
        .delete();
    }
  );
}

// --- SCHEDULED SESSIONS & COMPLETIONS ---
export interface EnrichedScheduledSession extends ScheduledSession {
  templateName: string;
  routineName: string;
  areaColor?: string;
  areaName?: string;
  notes?: string;
  tinyMinutes?: number;
  checklist: any[];
}

export async function getScheduledSessionsForDate(dateStr: string): Promise<EnrichedScheduledSession[]> {
  const sessions = await db.scheduledSessions.where("date").equals(dateStr).toArray();
  const enriched: EnrichedScheduledSession[] = [];

  for (const s of sessions) {
    const template = await db.sessionTemplates.get(s.templateId);
    const routine = await db.routines.get(s.routineId);
    let areaColor = "#7B6FE0";
    let areaName = "";

    if (routine?.areaId) {
      const area = await db.lifeAreas.get(routine.areaId);
      if (area) {
        areaColor = area.color;
        areaName = area.name;
      }
    }

    enriched.push({
      ...s,
      templateName: template?.name || routine?.name || "Session",
      routineName: routine?.name || "Routine",
      areaColor,
      areaName,
      notes: template?.notes,
      tinyMinutes: template?.tinyMinutes || 5,
      checklist: template?.checklist || [],
    });
  }

  // Sort by startTime (nulls last)
  enriched.sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  return enriched;
}

export async function completeScheduledSession(
  sessionId: string,
  actualMinutes?: number,
  notes?: string,
  progressNote?: string
): Promise<void> {
  const session = await db.scheduledSessions.get(sessionId);
  if (!session) return;

  const now = new Date().toISOString();
  const prevState = session.state;

  await db.scheduledSessions.update(sessionId, {
    state: "done",
    updatedAt: now,
  });

  const completion: Completion = {
    id: generateId(),
    scheduledSessionId: sessionId,
    status: "done",
    completedAt: now,
    actualMinutes: actualMinutes || session.minutes,
    note: notes,
    progressNote: progressNote,
    createdAt: now,
  };

  await db.completions.add(completion);
  await logChange("complete_session", {
    sessionId,
    prevState,
    completionId: completion.id,
  });
}

export async function skipScheduledSession(
  sessionId: string,
  reason?: string
): Promise<void> {
  const session = await db.scheduledSessions.get(sessionId);
  if (!session) return;

  const now = new Date().toISOString();
  const prevState = session.state;

  await db.scheduledSessions.update(sessionId, {
    state: "skipped",
    updatedAt: now,
  });

  const completion: Completion = {
    id: generateId(),
    scheduledSessionId: sessionId,
    status: "skipped",
    completedAt: now,
    skipReason: reason,
    createdAt: now,
  };

  await db.completions.add(completion);
  await logChange("skip_session", {
    sessionId,
    prevState,
    completionId: completion.id,
  });
}

export async function moveScheduledSession(sessionId: string, newDateStr: string): Promise<void> {
  const session = await db.scheduledSessions.get(sessionId);
  if (!session) return;

  const todayStr = toISODate(new Date());
  let newState: ScheduledSession["state"] = "planned";
  if (newDateStr === todayStr) newState = "due_today";

  await db.scheduledSessions.update(sessionId, {
    date: newDateStr,
    state: newState,
    movedFrom: session.date,
    updatedAt: new Date().toISOString(),
  });
}

// --- GOALS ---
export async function getGoals(): Promise<Goal[]> {
  return await db.goals.toArray();
}

export async function createGoal(data: {
  title: string;
  notes?: string;
  targetDate?: string | null;
  areaId?: string | null;
}): Promise<Goal> {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: generateId(),
    title: data.title.trim(),
    notes: data.notes?.trim() || undefined,
    targetDate: data.targetDate || null,
    areaId: data.areaId || null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await db.goals.add(goal);
  return goal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
  await db.goals.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id);
}

// --- RESET TODAY (Signature Flow) ---
export async function resetTodayProposals(
  todayStr: string,
  keepIds: string[],
  moveToDateStr: string
): Promise<void> {
  const sessions = await db.scheduledSessions.where("date").equals(todayStr).toArray();

  const batchId = generateId();
  const prevStates: { id: string; date: string; state: string }[] = [];

  for (const s of sessions) {
    if (s.state === "due_today" || s.state === "planned") {
      if (!keepIds.includes(s.id)) {
        prevStates.push({ id: s.id, date: s.date, state: s.state });
        await db.scheduledSessions.update(s.id, {
          date: moveToDateStr,
          state: "moved",
          movedFrom: todayStr,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  await logChange("reset_today", { batchId, prevStates });
}

// --- UNDO / CHANGE LOG ---
export async function logChange(action: string, payload: any): Promise<string> {
  const id = generateId();
  const entry: ChangeLogEntry = {
    id,
    batchId: generateId(),
    action,
    payload,
    undoneAt: null,
    createdAt: new Date().toISOString(),
  };
  await db.changeLog.add(entry);
  return id;
}

export async function undoLastChange(): Promise<boolean> {
  const last = await db.changeLog
    .orderBy("createdAt")
    .reverse()
    .filter((e) => !e.undoneAt)
    .first();

  if (!last) return false;

  const { action, payload } = last;

  if (action === "complete_session" || action === "skip_session") {
    const { sessionId, prevState, completionId } = payload;
    await db.scheduledSessions.update(sessionId, {
      state: prevState || "due_today",
      updatedAt: new Date().toISOString(),
    });
    if (completionId) {
      await db.completions.delete(completionId);
    }
  } else if (action === "complete_task") {
    const { taskId, completionId } = payload;
    await db.tasks.update(taskId, {
      doneAt: null,
      updatedAt: new Date().toISOString(),
    });
    if (completionId) {
      await db.completions.delete(completionId);
    }
  } else if (action === "reset_today") {
    const { prevStates } = payload;
    if (Array.isArray(prevStates)) {
      for (const item of prevStates) {
        await db.scheduledSessions.update(item.id, {
          date: item.date,
          state: item.state as any,
          movedFrom: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  await db.changeLog.update(last.id, { undoneAt: new Date().toISOString() });
  return true;
}

