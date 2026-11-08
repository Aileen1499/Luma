"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  getRoutines,
  pauseRoutine,
  deleteRoutine,
} from "@/lib/db/repository";
import type { Routine, ScheduledSessionState } from "@/lib/db/types";
import { toISODate, getWeekDays } from "@/lib/i18n/format";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { RoutineModal } from "@/components/RoutineModal";
import { RotateCcw, Check, Plus, Pause, Play, Trash2 } from "lucide-react";

export default function RoutinesPage() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-xs font-semibold text-text-2 tracking-widest uppercase">
            Loading Routines…
          </div>
        </div>
      }
    >
      <RoutinesContent />
    </ClientOnly>
  );
}

function RoutinesContent() {
  const [viewMode, setViewMode] = useState<"programs" | "week_grid">("programs");
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any | null>(null);

  const today = new Date();
  const todayStr = toISODate(today);
  const weekDays = getWeekDays(today, 1);

  const routines = useLiveQuery(() => getRoutines(true), []);
  const allSessions = useLiveQuery(() => db.scheduledSessions.toArray(), []);

  const activeRoutines = routines || [];

  // Calculate week stats
  const currentWeekDateStrings = weekDays.map((d) => toISODate(d));
  const currentWeekSessions =
    allSessions?.filter((s) => currentWeekDateStrings.includes(s.date)) || [];

  const doneWeekCount = currentWeekSessions.filter((s) => s.state === "done").length;
  const totalWeekCount = currentWeekSessions.length;

  const handleTogglePause = async (id: string) => {
    await pauseRoutine(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this routine and all its planned future sessions? Past completions will be preserved.")) {
      await deleteRoutine(id);
      setSelectedRoutine(null);
    }
  };

  const isEmpty = activeRoutines.length === 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Routines
            </h1>
            <p className="text-xs text-text-2 mt-0.5">
              {totalWeekCount > 0
                ? `${doneWeekCount} of ${totalWeekCount} sessions this week`
                : "Things you repeat each week"}
            </p>
          </div>

          {!isEmpty && (
            <button
              onClick={() => setRoutineModalOpen(true)}
              className="luma-button-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {/* View Switcher: Programs vs Week Grid */}
        {!isEmpty && (
          <div className="flex p-1 bg-white/70 rounded-2xl border border-border">
            <button
              onClick={() => setViewMode("programs")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "programs"
                  ? "bg-[#1C1A26] text-white"
                  : "text-text-2 hover:text-ink"
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => setViewMode("week_grid")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "week_grid"
                  ? "bg-[#1C1A26] text-white"
                  : "text-text-2 hover:text-ink"
              }`}
            >
              Week grid
            </button>
          </div>
        )}

        {/* Empty State vs Content */}
        {isEmpty ? (
          <div className="my-8">
            <EmptyState
              icon={RotateCcw}
              title="Create your first routine"
              message="A routine groups the sessions you repeat, like study, training or self-care. You choose the days and times."
              primaryActionLabel="Create routine"
              onPrimaryAction={() => setRoutineModalOpen(true)}
            />
          </div>
        ) : viewMode === "programs" ? (
          /* Programs View (Canvas Screen 4) */
          <div className="flex flex-col gap-3">
            {/* Week days column header */}
            <div className="flex items-center justify-end pr-3 gap-2 text-[10px] font-bold text-text-2/70 uppercase">
              <span className="w-6 text-center">M</span>
              <span className="w-6 text-center">T</span>
              <span className="w-6 text-center">W</span>
              <span className="w-6 text-center">T</span>
              <span className="w-6 text-center">F</span>
              <span className="w-6 text-center">S</span>
              <span className="w-6 text-center">S</span>
            </div>

            {activeRoutines.map((routine) => {
              const template = routine.templates[0];
              const isPaused = routine.status === "paused";

              return (
                <div
                  key={routine.id}
                  className={`luma-card p-4 flex flex-col gap-3 ${
                    isPaused ? "opacity-60 bg-white/70" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-1.5 h-9 rounded-full bg-[#5E52C9]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-ink">
                            {routine.name}
                          </h3>
                          {isPaused && (
                            <span className="text-[10px] font-semibold text-text-2 bg-black/5 px-2 py-0.5 rounded-full">
                              Paused
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-2">
                          {template?.defaultMinutes || 25} min · {routine.weeklyTarget}× a week
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePause(routine.id)}
                        title={isPaused ? "Resume" : "Pause"}
                        className="p-1.5 rounded-full hover:bg-black/5 text-text-2"
                      >
                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(routine.id)}
                        title="Delete"
                        className="p-1.5 rounded-full hover:bg-red-50 text-text-2 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Completion Bubbles */}
                  <div className="flex items-center justify-end gap-2 pr-1">
                    {weekDays.map((d) => {
                      const dateStr = toISODate(d);
                      const session = currentWeekSessions.find(
                        (s) => s.routineId === routine.id && s.date === dateStr
                      );

                      if (!session) {
                        return (
                          <span
                            key={dateStr}
                            className="w-6 h-6 rounded-md bg-[#F7F1E8]/40 border border-border/40"
                          />
                        );
                      }

                      const isDone = session.state === "done";
                      const isDue = session.state === "due_today";
                      const isMissed = session.state === "missed";
                      const isSkipped = session.state === "skipped";

                      return (
                        <div
                          key={dateStr}
                          title={`${session.date}: ${session.state}`}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isDone
                              ? "bg-[#3F8F6B] text-white"
                              : isDue
                              ? "border-2 border-[#1C1A26] bg-[#D6CBFA]/30"
                              : isMissed
                              ? "pattern-striped"
                              : isSkipped
                              ? "border border-dashed border-text-2/40 text-text-2"
                              : "border border-border bg-white"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          {isDue && <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A26]" />}
                          {isSkipped && <span className="text-[10px] font-bold">–</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Week Grid View (Canvas Screen 5) */
          <div className="luma-card p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-2 border-b border-border pb-2">
              <span>SESSION TYPE</span>
              <div className="flex gap-2.5 pr-2">
                <span className="w-5 text-center">M</span>
                <span className="w-5 text-center">T</span>
                <span className="w-5 text-center">W</span>
                <span className="w-5 text-center">T</span>
                <span className="w-5 text-center">F</span>
                <span className="w-5 text-center">S</span>
                <span className="w-5 text-center">S</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {activeRoutines.map((routine) => {
                const template = routine.templates[0];
                return (
                  <div key={routine.id} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      {routine.name}
                    </span>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-semibold text-ink truncate max-w-[140px]">
                        {template?.name || routine.name}
                      </span>

                      <div className="flex gap-2.5 pr-2">
                        {weekDays.map((d) => {
                          const dateStr = toISODate(d);
                          const session = currentWeekSessions.find(
                            (s) => s.routineId === routine.id && s.date === dateStr
                          );

                          if (!session) {
                            return (
                              <span
                                key={dateStr}
                                className="w-5 h-5 rounded flex items-center justify-center text-text-2/20 text-xs"
                              >
                                ·
                              </span>
                            );
                          }

                          const isDone = session.state === "done";
                          const isDue = session.state === "due_today";
                          const isMissed = session.state === "missed";
                          const isSkipped = session.state === "skipped";

                          return (
                            <span
                              key={dateStr}
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                isDone
                                  ? "bg-[#3F8F6B] text-white"
                                  : isDue
                                  ? "border border-ink text-ink font-bold"
                                  : isMissed
                                  ? "pattern-striped"
                                  : isSkipped
                                  ? "text-text-2"
                                  : "border border-border"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              {isDue && <span className="w-1 h-1 rounded-full bg-ink" />}
                              {isSkipped && "-"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Legend (Accessibility requirement) */}
            <div className="border-t border-border pt-3 mt-2 flex flex-wrap items-center gap-3 text-[10px] text-text-2">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-[#3F8F6B] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded border border-border" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded border border-ink flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-ink" />
                </span>
                <span>Due today</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded pattern-striped" />
                <span>Missed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded flex items-center justify-center font-bold">
                  –
                </span>
                <span>Skipped</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <RoutineModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        onSaved={() => {}}
      />
    </AppShell>
  );
}

