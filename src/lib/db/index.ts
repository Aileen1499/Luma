import Dexie, { type Table } from "dexie";
import type {
  LifeArea,
  Goal,
  Milestone,
  Routine,
  SessionTemplate,
  ScheduleRule,
  ScheduledSession,
  Completion,
  Task,
  UserSettings,
  ChangeLogEntry,
} from "./types";

export class LumaDatabase extends Dexie {
  lifeAreas!: Table<LifeArea, string>;
  goals!: Table<Goal, string>;
  milestones!: Table<Milestone, string>;
  routines!: Table<Routine, string>;
  sessionTemplates!: Table<SessionTemplate, string>;
  scheduleRules!: Table<ScheduleRule, string>;
  scheduledSessions!: Table<ScheduledSession, string>;
  completions!: Table<Completion, string>;
  tasks!: Table<Task, string>;
  settings!: Table<UserSettings, string>;
  changeLog!: Table<ChangeLogEntry, string>;

  constructor() {
    super("LumaDB");

    this.version(1).stores({
      lifeAreas: "id, name, archivedAt",
      goals: "id, areaId, status, targetDate",
      milestones: "id, goalId, dueDate, doneAt",
      routines: "id, goalId, areaId, status, scheduleMode",
      sessionTemplates: "id, routineId, name",
      scheduleRules: "id, templateId, routineId",
      scheduledSessions:
        "id, templateId, routineId, date, state, [date+state], [routineId+date]",
      completions:
        "id, scheduledSessionId, taskId, status, completedAt, [status+completedAt]",
      tasks: "id, dueDate, doneAt, pinnedToday, areaId, goalId, deletedAt",
      settings: "id",
      changeLog: "id, batchId, undoneAt, createdAt",
    });
  }
}

export const db = new LumaDatabase();

// Default user settings (preferences only, NO sample data or content)
export const DEFAULT_SETTINGS: UserSettings = {
  id: "current",
  displayName: "",
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC",
  weekStart: 1, // Monday
  locale: "en",
  reminderOffsetMinutes: 15,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  dailyCap: 3,
  xpEnabled: false,
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

