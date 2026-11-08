/**
 * Utility functions for date calculations, formatting with Intl,
 * and streak/completion statistics.
 */

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

/**
 * Format a Date object to YYYY-MM-DD local date string.
 */
export function toISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(isoStr: string): Date {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format date for header: "THURSDAY · 5 NOV"
 */
export function formatHeaderDate(isoDate: string, locale = "en-US"): string {
  const date = parseISODate(isoDate);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" })
    .format(date)
    .toUpperCase();
  const day = date.getDate();
  const month = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .toUpperCase();
  return `${weekday} · ${day} ${month}`;
}

/**
 * Format month/year for planner: "November 2026"
 */
export function formatMonthYear(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

/**
 * Format short day for strips: "Mon", "Tue"
 */
export function formatDayShort(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

/**
 * Get standard 7 days of the week containing the given date, respect weekStart (1 = Mon, 0 = Sun, 6 = Sat)
 */
export function getWeekDays(referenceDate: Date = new Date(), weekStart: 0 | 1 | 6 = 1): Date[] {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);

  const currentDay = d.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
  // Distance from week start
  const diff = (currentDay - weekStart + 7) % 7;
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Calculate weekly completion percentage:
 * done / (done + missed + still planned)
 */
export function calculateWeeklyCompletion(
  doneCount: number,
  missedCount: number,
  plannedCount: number
): number {
  const total = doneCount + missedCount + plannedCount;
  if (total === 0) return 0;
  return Math.round((doneCount / total) * 100);
}

/**
 * Calculate streak: consecutive days counting backwards from today (or yesterday if today has no completion yet)
 * with at least one completion.
 */
export function calculateStreak(completedDates: Set<string>, todayStr: string): { current: number; best: number } {
  if (completedDates.size === 0) {
    return { current: 0, best: 0 };
  }

  // Calculate current streak
  let streak = 0;
  let checkDate = parseISODate(todayStr);

  // If today has no completion yet, check if yesterday had one to keep the active streak alive
  if (!completedDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const iso = toISODate(checkDate);
    if (completedDates.has(iso)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate best streak across all sorted unique completion dates
  const sortedDates = Array.from(completedDates).sort();
  let best = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const d = parseISODate(dStr);
    if (prevDate) {
      const diffTime = d.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    } else {
      currentRun = 1;
    }
    prevDate = d;
    if (currentRun > best) {
      best = currentRun;
    }
  }

  return { current: streak, best: Math.max(best, streak) };
}

