"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getScheduledSessionsForDate,
  getTasks,
  completeScheduledSession,
} from "@/lib/db/repository";
import {
  toISODate,
  formatMonthYear,
  getWeekDays,
} from "@/lib/i18n/format";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { TaskModal } from "@/components/TaskModal";
import { Calendar, Check, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const selectedDateStr = toISODate(selectedDate);
  const weekDays = getWeekDays(selectedDate, 1);

  const sessions = useLiveQuery(
    () => getScheduledSessionsForDate(selectedDateStr),
    [selectedDateStr]
  );
  const tasks = useLiveQuery(() => getTasks(false), []);

  const daySessions = sessions || [];
  const anytimeTasks = tasks?.filter((t) => !t.dueDate && !t.doneAt) || [];

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const isEmpty = daySessions.length === 0 && anytimeTasks.length === 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 pt-2">
        {/* Month Header and Day/Week/Month Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {formatMonthYear(selectedDate)}
            </h1>
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded-full hover:bg-black/5 text-text-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 rounded-full hover:bg-black/5 text-text-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex p-0.5 bg-white/70 rounded-xl border border-border">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`py-1 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? "bg-[#1C1A26] text-white"
                    : "text-text-2 hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1 bg-white/70 p-2 rounded-2xl border border-border">
          {weekDays.map((d) => {
            const dateStr = toISODate(d);
            const isSelected = dateStr === selectedDateStr;
            const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                  isSelected
                    ? "bg-[#1C1A26] text-white font-bold"
                    : "text-text-2 hover:bg-black/5"
                }`}
              >
                <span className="text-[10px] uppercase font-semibold mb-1 opacity-70">
                  {dayLabel}
                </span>
                <span className="text-sm">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Content vs Empty State */}
        {isEmpty ? (
          <div className="my-8">
            <EmptyState
              icon={Calendar}
              title="Your schedule is clear"
              message="Nothing planned yet. Add a session, task or event when you are ready."
              primaryActionLabel="Add to schedule"
              onPrimaryAction={() => setTaskModalOpen(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ANYTIME Tasks Pill Row */}
            {anytimeTasks.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-text-2 uppercase tracking-wider block mb-2 px-1">
                  ANYTIME
                </span>
                <div className="flex flex-wrap gap-2">
                  {anytimeTasks.slice(0, 4).map((task) => (
                    <span
                      key={task.id}
                      className="px-3 py-1.5 rounded-full bg-white border border-border text-xs font-semibold text-ink"
                    >
                      {task.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time Blocks List */}
            <div className="flex flex-col gap-3">
              {daySessions.map((item) => {
                const isDone = item.state === "done";
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="w-12 text-xs font-semibold text-text-2 shrink-0 pt-3">
                      {item.startTime || "Anytime"}
                    </span>

                    <div
                      className={`luma-card flex-1 p-3.5 flex items-center justify-between border-l-4 ${
                        isDone ? "opacity-60 bg-white/70" : "bg-white"
                      }`}
                      style={{ borderLeftColor: item.areaColor || "#5E52C9" }}
                    >
                      <div>
                        <h4
                          className={`text-sm font-semibold ${
                            isDone ? "line-through text-text-2" : "text-ink"
                          }`}
                        >
                          {item.templateName}
                        </h4>
                        <span className="text-xs text-text-2 flex items-center gap-1.5 mt-0.5">
                          <span>{item.minutes} min</span>
                          <span>·</span>
                          <span>{item.routineName}</span>
                        </span>
                      </div>

                      {isDone ? (
                        <span className="text-xs font-semibold text-[#3F8F6B] bg-[#44664B]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => completeScheduledSession(item.id)}
                          className="w-6 h-6 rounded-full border border-text-2/40 hover:border-accent flex items-center justify-center transition-colors"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        defaultDate={selectedDateStr}
        onSaved={() => {}}
      />
    </AppShell>
  );
}

