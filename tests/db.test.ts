import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import {
  createTask,
  toggleTaskComplete,
  deleteTask,
  getTasks,
  createRoutine,
  completeScheduledSession,
  getScheduledSessionsForDate,
  undoLastChange,
} from "../src/lib/db/repository";
import { exportLumaBackup, importLumaBackup, clearAllLumaData } from "../src/lib/db/exportImport";
import { syncScheduleForDateRange } from "../src/lib/db/scheduleGenerator";
import { toISODate } from "../src/lib/i18n/format";

describe("LUMA Local-First Data Layer", () => {
  beforeEach(async () => {
    await clearAllLumaData();
  });

  it("must be blank by default with zero user rows", async () => {
    const [tasks, routines, templates, sessions, completions, goals] = await Promise.all([
      db.tasks.count(),
      db.routines.count(),
      db.sessionTemplates.count(),
      db.scheduledSessions.count(),
      db.completions.count(),
      db.goals.count(),
    ]);

    expect(tasks).toBe(0);
    expect(routines).toBe(0);
    expect(templates).toBe(0);
    expect(sessions).toBe(0);
    expect(completions).toBe(0);
    expect(goals).toBe(0);
  });

  it("creates, toggles, and deletes a task", async () => {
    const task = await createTask({
      title: "Review IELTS notes",
      notes: "Focus on task 2 essay structure",
      pinnedToday: true,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Review IELTS notes");
    expect(task.doneAt).toBeNull();

    // Toggle complete
    const isDone = await toggleTaskComplete(task.id);
    expect(isDone).toBe(true);

    const updated = await db.tasks.get(task.id);
    expect(updated?.doneAt).not.toBeNull();

    // Verify completion row exists
    const completionCount = await db.completions.count();
    expect(completionCount).toBe(1);

    // Delete task (soft delete)
    await deleteTask(task.id);
    const activeTasks = await getTasks(false);
    expect(activeTasks.length).toBe(0);
  });

  it("creates a routine and generates scheduled sessions without duplicates", async () => {
    const routine = await createRoutine({
      name: "Mandarin Study",
      templateName: "Vocabulary review",
      defaultMinutes: 25,
      days: [1, 3, 5], // Mon, Wed, Fri
      startTime: "08:30",
    });

    expect(routine.id).toBeDefined();
    expect(routine.name).toBe("Mandarin Study");

    // Check templates and rules
    const templates = await db.sessionTemplates.where("routineId").equals(routine.id).toArray();
    expect(templates.length).toBe(1);

    const rules = await db.scheduleRules.where("routineId").equals(routine.id).toArray();
    expect(rules.length).toBe(1);
    expect(rules[0].days).toEqual([1, 3, 5]);

    // Check that scheduled sessions were generated
    const initialSessionCount = await db.scheduledSessions.count();
    expect(initialSessionCount).toBeGreaterThan(0);

    // Syncing the same date range again must not create duplicates!
    const today = new Date();
    const todayStr = toISODate(today);
    await syncScheduleForDateRange(todayStr, todayStr);

    const recheckSessionCount = await db.scheduledSessions.count();
    expect(recheckSessionCount).toBe(initialSessionCount);
  });

  it("completing a session creates a completion record and can be undone", async () => {
    const routine = await createRoutine({
      name: "Strength Training",
      templateName: "Upper body",
      defaultMinutes: 45,
      days: [1, 2, 3, 4, 5, 6, 7],
    });

    const todayStr = toISODate(new Date());
    const sessions = await getScheduledSessionsForDate(todayStr);
    expect(sessions.length).toBeGreaterThan(0);

    const session = sessions[0];
    await completeScheduledSession(session.id, 45, "Felt energetic");

    const updatedSession = await db.scheduledSessions.get(session.id);
    expect(updatedSession?.state).toBe("done");

    const completion = await db.completions.where("scheduledSessionId").equals(session.id).first();
    expect(completion).toBeDefined();
    expect(completion?.status).toBe("done");

    // Test Undo
    const undone = await undoLastChange();
    expect(undone).toBe(true);

    const revertedSession = await db.scheduledSessions.get(session.id);
    expect(revertedSession?.state).not.toBe("done");

    const revertedCompletion = await db.completions.where("scheduledSessionId").equals(session.id).first();
    expect(revertedCompletion).toBeUndefined();
  });

  it("exports valid backup JSON and imports cleanly", async () => {
    await createTask({ title: "Backup test task" });
    const backupJson = await exportLumaBackup();
    const parsed = JSON.parse(backupJson);

    expect(parsed.appName).toBe("LUMA");
    expect(parsed.data.tasks.length).toBe(1);

    // Clear everything
    await clearAllLumaData();
    expect(await db.tasks.count()).toBe(0);

    // Import
    const importRes = await importLumaBackup(backupJson);
    expect(importRes.success).toBe(true);
    expect(await db.tasks.count()).toBe(1);
  });
});
