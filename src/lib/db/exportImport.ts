import { db, DEFAULT_SETTINGS } from "./index";

export interface LumaBackupData {
  version: 1;
  exportedAt: string;
  appName: "LUMA";
  data: {
    lifeAreas: any[];
    goals: any[];
    milestones: any[];
    routines: any[];
    sessionTemplates: any[];
    scheduleRules: any[];
    scheduledSessions: any[];
    completions: any[];
    tasks: any[];
    settings?: any;
  };
}

export async function exportLumaBackup(): Promise<string> {
  const [
    lifeAreas,
    goals,
    milestones,
    routines,
    sessionTemplates,
    scheduleRules,
    scheduledSessions,
    completions,
    tasks,
    settings,
  ] = await Promise.all([
    db.lifeAreas.toArray(),
    db.goals.toArray(),
    db.milestones.toArray(),
    db.routines.toArray(),
    db.sessionTemplates.toArray(),
    db.scheduleRules.toArray(),
    db.scheduledSessions.toArray(),
    db.completions.toArray(),
    db.tasks.toArray(),
    db.settings.get("current"),
  ]);

  const backup: LumaBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: "LUMA",
    data: {
      lifeAreas,
      goals,
      milestones,
      routines,
      sessionTemplates,
      scheduleRules,
      scheduledSessions,
      completions,
      tasks,
      settings: settings || DEFAULT_SETTINGS,
    },
  };

  return JSON.stringify(backup, null, 2);
}

export async function importLumaBackup(jsonStr: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonStr) as LumaBackupData;
    if (!parsed || parsed.appName !== "LUMA" || !parsed.data) {
      return { success: false, message: "Invalid LUMA backup format." };
    }

    const { data } = parsed;

    await db.transaction(
      "rw",
      [
        db.lifeAreas,
        db.goals,
        db.milestones,
        db.routines,
        db.sessionTemplates,
        db.scheduleRules,
        db.scheduledSessions,
        db.completions,
        db.tasks,
        db.settings,
        db.changeLog,
      ],
      async () => {
        await Promise.all([
          db.lifeAreas.clear(),
          db.goals.clear(),
          db.milestones.clear(),
          db.routines.clear(),
          db.sessionTemplates.clear(),
          db.scheduleRules.clear(),
          db.scheduledSessions.clear(),
          db.completions.clear(),
          db.tasks.clear(),
          db.changeLog.clear(),
        ]);

        if (data.lifeAreas?.length) await db.lifeAreas.bulkAdd(data.lifeAreas);
        if (data.goals?.length) await db.goals.bulkAdd(data.goals);
        if (data.milestones?.length) await db.milestones.bulkAdd(data.milestones);
        if (data.routines?.length) await db.routines.bulkAdd(data.routines);
        if (data.sessionTemplates?.length) await db.sessionTemplates.bulkAdd(data.sessionTemplates);
        if (data.scheduleRules?.length) await db.scheduleRules.bulkAdd(data.scheduleRules);
        if (data.scheduledSessions?.length) await db.scheduledSessions.bulkAdd(data.scheduledSessions);
        if (data.completions?.length) await db.completions.bulkAdd(data.completions);
        if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);

        if (data.settings) {
          await db.settings.put(data.settings);
        }
      }
    );

    return { success: true, message: "Backup successfully restored." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to parse backup JSON." };
  }
}

export async function clearAllLumaData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.lifeAreas,
      db.goals,
      db.milestones,
      db.routines,
      db.sessionTemplates,
      db.scheduleRules,
      db.scheduledSessions,
      db.completions,
      db.tasks,
      db.settings,
      db.changeLog,
    ],
    async () => {
      await Promise.all([
        db.lifeAreas.clear(),
        db.goals.clear(),
        db.milestones.clear(),
        db.routines.clear(),
        db.sessionTemplates.clear(),
        db.scheduleRules.clear(),
        db.scheduledSessions.clear(),
        db.completions.clear(),
        db.tasks.clear(),
        db.changeLog.clear(),
      ]);
      await db.settings.put(DEFAULT_SETTINGS);
    }
  );
}

