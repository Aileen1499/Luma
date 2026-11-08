"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  toISODate,
  getWeekDays,
  calculateStreak,
  calculateWeeklyCompletion,
} from "@/lib/i18n/format";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/components/AppShell";
import { BarChart2, Flame, Award, Plus, X } from "lucide-react";

export default function ProgressPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-xs font-semibold text-text-2 tracking-widest uppercase">
            Loading Progress…
          </div>
        </div>
      }
    >
      <ProgressContent />
    </ClientOnly>
  );
}

function ProgressContent() {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");

  const today = new Date();
  const todayStr = toISODate(today);
  const weekDays = getWeekDays(today, 1);

  const completions = useLiveQuery(() => db.completions.toArray(), []);
  const allSessions = useLiveQuery(() => db.scheduledSessions.toArray(), []);

  // Set of completed ISO dates
  const completedDates = new Set<string>();
  completions?.forEach((c) => {
    if (c.status === "done") {
      completedDates.add(toISODate(new Date(c.completedAt)));
    }
  });

  const streakInfo = calculateStreak(completedDates, todayStr);

  // Week calculation
  const weekDateStrings = weekDays.map((d) => toISODate(d));
  const weekSessions = allSessions?.filter((s) => weekDateStrings.includes(s.date)) || [];

  const doneCount = weekSessions.filter((s) => s.state === "done").length;
  const missedCount = weekSessions.filter((s) => s.state === "missed").length;
  const plannedCount = weekSessions.filter((s) => s.state === "planned" || s.state === "due_today").length;

  const weeklyPct = calculateWeeklyCompletion(doneCount, missedCount, plannedCount);

  // Per day completion count for the bar chart
  const dayStats = weekDays.map((d) => {
    const dStr = toISODate(d);
    const daySessions = weekSessions.filter((s) => s.date === dStr);
    const done = daySessions.filter((s) => s.state === "done").length;
    const isToday = dStr === todayStr;
    const label = new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);
    return { dateStr: dStr, done, isToday, label };
  });

  const maxDayDone = Math.max(1, ...dayStats.map((s) => s.done));

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Progress
          </h1>
          <p className="text-xs text-text-2 mt-0.5">
            Consistency, not perfection
          </p>
        </div>

        {/* THIS WEEK Card (Canvas Screen 11) */}
        <div className="luma-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-text-2 tracking-wider uppercase block">
                THIS WEEK
              </span>
              <span className="font-display text-4xl font-bold text-ink">
                {weeklyPct}%
              </span>
            </div>
            {weeklyPct > 0 && (
              <span className="text-xs font-bold text-[#3F8F6B] bg-[#44664B]/10 px-2.5 py-1 rounded-full">
                Active rhythm
              </span>
            )}
          </div>

          {/* Weekly Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-24 pt-4 px-2">
            {dayStats.map((item) => {
              const heightPct = item.done > 0 ? Math.round((item.done / maxDayDone) * 100) : 12;
              return (
                <div key={item.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-md transition-all ${
                      item.done > 0
                        ? "bg-[#5E52C9]"
                        : item.isToday
                        ? "bg-[#1C1A26]"
                        : "bg-[#F7F1E8]"
                    }`}
                  />
                  <span className={`text-[10px] font-bold uppercase ${item.isToday ? "text-ink" : "text-text-2/60"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streaks Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="luma-card p-4 flex flex-col">
            <span className="font-display text-3xl font-bold text-ink mb-1">
              {streakInfo.current}
            </span>
            <span className="text-xs font-semibold text-text-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#E3A94B] fill-[#E3A94B]" />
              Day streak
            </span>
          </div>

          <div className="luma-card p-4 flex flex-col">
            <span className="font-display text-3xl font-bold text-ink mb-1">
              {streakInfo.best}
            </span>
            <span className="text-xs font-semibold text-text-2 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-accent" />
              Best streak
            </span>
          </div>
        </div>

        {/* Weekly Review Banner (Canvas Screen 11) */}
        <div className="luma-card p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-ink">Weekly review</h4>
            <p className="text-xs text-text-2 mt-0.5">What worked this week? What didn’t?</p>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="text-xs font-bold text-accent hover:underline mt-2 block"
            >
              Start review
            </button>
          </div>
        </div>
      </div>

      {/* Review Reflection Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-border flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                Weekly Reflection
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 text-text-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-2 mb-3">
              Take a quiet minute to reflect on your week. Plans are suggestions, not contracts.
            </p>

            <textarea
              rows={4}
              placeholder="What felt good? What can be simplified next week?…"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="w-full p-3 rounded-xl border border-border text-sm text-ink mb-4 resize-none focus:outline-none focus:border-accent"
            />

            <button
              onClick={() => {
                alert("Reflection recorded.");
                setReviewModalOpen(false);
                setReflectionText("");
              }}
              className="luma-button-primary w-full py-2.5 text-xs font-semibold"
            >
              Save Reflection
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

