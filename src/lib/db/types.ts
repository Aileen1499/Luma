export type LifeAreaColor = string;

export interface LifeArea {
  id: string;
  name: string;
  color: LifeAreaColor;
  archivedAt?: string | null;
  createdAt: string;
}

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export interface Goal {
  id: string;
  areaId?: string | null;
  title: string;
  notes?: string;
  targetDate?: string | null; // YYYY-MM-DD
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  dueDate?: string | null; // YYYY-MM-DD
  doneAt?: string | null;
  createdAt: string;
}

export type RoutineScheduleMode = "fixed" | "flexible";
export type RoutineStatus = "active" | "paused" | "archived";

export interface Routine {
  id: string;
  goalId?: string | null;
  areaId?: string | null;
  name: string;
  notes?: string;
  scheduleMode: RoutineScheduleMode;
  weeklyTarget: number;
  status: RoutineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SessionTemplate {
  id: string;
  routineId: string;
  name: string;
  defaultMinutes: number;
  tinyMinutes?: number; // e.g. 5
  material?: string;
  chapter?: string;
  focus?: string;
  notes?: string;
  checklist: ChecklistItem[];
  remindWhereIStopped?: boolean;
  createdAt: string;
}

export type TimeWindow = "morning" | "afternoon" | "evening" | "anytime";

export interface ScheduleRule {
  id: string;
  templateId: string;
  routineId: string;
  days: number[]; // 1 = Monday, 7 = Sunday
  startTime?: string | null; // "HH:MM" e.g. "09:00"
  window?: TimeWindow;
  everyNWeeks: number;
  createdAt: string;
}

export type ScheduledSessionState =
  | "planned"
  | "due_today"
  | "done"
  | "skipped"
  | "moved"
  | "missed";

export interface ScheduledSession {
  id: string;
  templateId: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // "HH:MM"
  minutes: number;
  state: ScheduledSessionState;
  movedFrom?: string | null; // YYYY-MM-DD if moved
  createdAt: string;
  updatedAt: string;
}

export type CompletionStatus = "done" | "skipped";

export interface Completion {
  id: string;
  scheduledSessionId?: string | null;
  taskId?: string | null;
  status: CompletionStatus;
  completedAt: string; // ISO string
  actualMinutes?: number;
  note?: string;
  progressNote?: string; // "where I stopped"
  skipReason?: string; // "tired" | "busy" | "sick" | "other"
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string | null; // YYYY-MM-DD
  areaId?: string | null;
  goalId?: string | null;
  doneAt?: string | null; // ISO string when done
  pinnedToday: boolean;
  checklist?: ChecklistItem[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: "current";
  displayName: string;
  timezone: string; // IANA name
  weekStart: 0 | 1 | 6; // 1 = Monday, 0 = Sunday, 6 = Saturday
  locale: string;
  reminderOffsetMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyCap: number;
  xpEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeLogEntry {
  id: string;
  batchId: string;
  action: string;
  payload: any;
  undoneAt?: string | null;
  createdAt: string;
}

