import { db } from "./index";
import type { ScheduledSession } from "./types";
import { toISODate, parseISODate, generateId } from "../i18n/format";

/**
 * Generates scheduled sessions for active routines across a date range.
 * Guarantees no duplicates and respects past completions.
 */
export async function syncScheduleForDateRange(startDateStr: string, endDateStr: string): Promise<void> {
  const routines = await db.routines.where("status").equals("active").toArray();
  const todayStr = toISODate(new Date());

  const startDate = parseISODate(startDateStr);
  const endDate = parseISODate(endDateStr);

  for (const routine of routines) {
    const templates = await db.sessionTemplates.where("routineId").equals(routine.id).toArray();
    for (const template of templates) {
      const rules = await db.scheduleRules.where("templateId").equals(template.id).toArray();

      for (const rule of rules) {
        // Iterate through each date in the range
        const curr = new Date(startDate);
        while (curr <= endDate) {
          const dateStr = toISODate(curr);
          // Day of week: 1 = Mon ... 7 = Sun (JavaScript getDay() is 0=Sun, 1=Mon... 6=Sat)
          const jsDay = curr.getDay();
          const specDay = jsDay === 0 ? 7 : jsDay;

          if (rule.days.includes(specDay)) {
            // Check if a session already exists for this template and date
            const existing = await db.scheduledSessions
              .where("[routineId+date]")
              .equals([routine.id, dateStr])
              .and((s) => s.templateId === template.id)
              .first();

            if (!existing) {
              let initialState: ScheduledSession["state"] = "planned";
              if (dateStr === todayStr) {
                initialState = "due_today";
              } else if (dateStr < todayStr) {
                initialState = "missed";
              }

              const newSession: ScheduledSession = {
                id: generateId(),
                templateId: template.id,
                routineId: routine.id,
                date: dateStr,
                startTime: rule.startTime || null,
                minutes: template.defaultMinutes,
                state: initialState,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await db.scheduledSessions.add(newSession);
            } else {
              // Update state if date transitioned to today and wasn't completed or skipped
              if (dateStr === todayStr && existing.state === "planned") {
                await db.scheduledSessions.update(existing.id, {
                  state: "due_today",
                  updatedAt: new Date().toISOString(),
                });
              } else if (dateStr < todayStr && (existing.state === "planned" || existing.state === "due_today")) {
                await db.scheduledSessions.update(existing.id, {
                  state: "missed",
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      }
    }
  }
}

