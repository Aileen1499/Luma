"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  getScheduledSessionsForDate,
  completeScheduledSession,
  getTasks,
  toggleTaskComplete,
  EnrichedScheduledSession,
} from "@/lib/db/repository";
import {
  toISODate,
  formatHeaderDate,
  getWeekDays,
  calculateStreak,
  calculateWeeklyCompletion,
} from "@/lib/i18n/format";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { TaskModal } from "@/components/TaskModal";
import { RoutineModal } from "@/components/RoutineModal";
import { ResetTodayModal } from "@/components/ResetTodayModal";
import { FocusTimerModal } from "@/components/FocusTimerModal";
import { useToast } from "@/components/Toast";
import {
  Compass,
  Check,
  Play,
  RotateCcw,
  ChevronRight,
  Flame,
  FileText,
} from "lucide-react";

export default function TodayPage() {
  const today = new Date();
  const todayStr = toISODate(today);
  const { showUndoToast } = useToast();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [timerSession, setTimerSession] = useState<EnrichedScheduledSession | null>(null);

  // Live query for settings
  const settings = useLiveQuery(() => db.settings.get("current"), []);

  // Live query for sessions today
  const sessions = useLiveQuery(
    () => getScheduledSessionsForDate(todayStr),
    [todayStr]
  );

  // Live query for tasks
  const tasks = useLiveQuery(() => getTasks(false), []);
  const todayTasks = tasks?.filter((t) => t.pinnedToday || t.dueDate === todayStr) || [];

  // Live query for all completions to calculate streaks
  const completions = useLiveQuery(() => db.completions.toArray(), []);
  const completedDates = new Set<string>();
  completions?.forEach((c) => {
    if (c.status === "done") {
      completedDates.add(toISODate(new Date(c.completedAt)));
    }
  });

  const streakInfo = calculateStreak(completedDates, todayStr);

  // Week days strip
  const weekDays = getWeekDays(today, settings?.weekStart || 1);

  // Greeting
  const hour = today.getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // Calculations for rhythm
  const scheduledList = sessions || [];
  const doneSessions = scheduledList.filter((s) => s.state === "done");
  const doneTasks = todayTasks.filter((t) => !!t.doneAt);
  const totalItems = scheduledList.length + todayTasks.length;
  const totalDone = doneSessions.length + doneTasks.length;
  const remaining = totalItems - totalDone;

  const completionPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Next actionable item
  const nextSession = scheduledList.find((s) => s.state === "due_today" || s.state === "planned");

  // Handle instant completion
  const handleToggleSession = async (session: EnrichedScheduledSession) => {
    if (session.state === "done") return;
    await completeScheduledSession(session.id);
    showUndoToast(`Completed ${session.templateName}`);
  };

  const handleToggleTask = async (taskId: string, title: string) => {
    const isDone = await toggleTaskComplete(taskId);
    if (isDone) {
      showUndoToast(`Completed task: ${title}`);
    }
  };

  const isEmpty = scheduledList.length === 0 && todayTasks.length === 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        {/* Top Header: Date & Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E3A94B]" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-text-2">
              {formatHeaderDate(todayStr)}
            </span>
          </div>

          {streakInfo.current > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border text-xs font-bold text-ink">
              <Flame className="w-3.5 h-3.5 text-[#E3A94B] fill-[#E3A94B]" />
              {streakInfo.current} day streak
            </div>
          ) : (
            <div className="text-[11px] text-text-2/60 font-medium">LUMA</div>
          )}
        </div>

        {/* Greeting Heading */}
        <h1 className="font-display text-3xl sm:text-4xl text-ink font-semibold tracking-tight">
          {greeting}
        </h1>

        {/* 7-Day Strip */}
        <div className="grid grid-cols-7 gap-1 bg-white/70 p-2 rounded-2xl border border-border">
          {weekDays.map((d) => {
            const dateStr = toISODate(d);
            const isToday = dateStr === todayStr;
            const hasCompleted = completedDates.has(dateStr);
            const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);

            return (
              <div
                key={dateStr}
                className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                  isToday ? "bg-[#1C1A26] text-white" : "text-text-2"
                }`}
              >
                <span className="text-[10px] uppercase font-semibold mb-1 opacity-70">
                  {dayLabel}
                </span>
                <span className={`text-sm font-bold ${isToday ? "text-white" : "text-ink"}`}>
                  {d.getDate()}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    hasCompleted
                      ? "bg-[#3F8F6B]"
                      : isToday
                      ? "bg-white/40"
                      : "bg-transparent"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Content Section: Empty State vs Active Today */}
        {isEmpty ? (
          <div className="my-6">
            <EmptyState
              icon={Compass}
              title="Nothing planned yet"
              message="Add a task or create a routine and it will show up here. Nothing is added for you."
              primaryActionLabel="+ Add a task"
              onPrimaryAction={() => setTaskModalOpen(true)}
              secondaryActionLabel="Create a routine"
              onSecondaryAction={() => setRoutineModalOpen(true)}
              footerHint="Feeling unsure where to start? Pick one small thing."
            />
          </div>
        ) : (
          <>
            {/* In Rhythm Progress Card (Canvas Screen 1) */}
            <div className="luma-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {/* Circular Percentage Pill */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-[#F7F1E8]"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="stroke-[#5E52C9] transition-all duration-500 ease-out"
                      strokeDasharray={`${completionPct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-display text-sm font-bold text-ink">
                    {completionPct}%
                  </span>
                </div>

                <div className="flex-1">
                  <span className="text-[10px] font-bold text-accent tracking-wider uppercase block mb-0.5">
                    IN RHYTHM · {totalDone} OF {totalItems} DONE
                  </span>
                  <h2 className="font-display text-xl text-ink font-semibold leading-tight">
                    {remaining === 0
                      ? "All done for today!"
                      : remaining === 1
                      ? "One thing left"
                      : `${remaining} small things left`}
                  </h2>
                </div>
              </div>

              {nextSession && (
                <button
                  onClick={() => setTimerSession(nextSession)}
                  className="luma-button-primary w-full py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start focus · {nextSession.minutes}m
                </button>
              )}
            </div>

            {/* Today's Focus List */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-bold text-text-2 tracking-wider uppercase">
                  TODAY&apos;S FOCUS
                </span>
                <span className="text-xs text-text-2/70 font-medium">
                  Tap ○ to finish
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {scheduledList.map((item) => {
                  const isDone = item.state === "done";
                  const isNext = !isDone && nextSession?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`luma-card p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isDone ? "opacity-60 bg-[#FFFFFF]/60" : "bg-white"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleSession(item)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isDone
                            ? "bg-[#3F8F6B] border-[#3F8F6B] text-white"
                            : "border-text-2/40 hover:border-accent"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div
                        onClick={() => setTimerSession(item)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isDone ? "line-through text-text-2" : "text-ink"
                          }`}
                        >
                          {item.templateName}
                        </h4>
                        <span className="text-xs text-text-2 flex items-center gap-1.5 mt-0.5">
                          <span>{item.minutes} min</span>
                          <span>·</span>
                          <span
                            className="font-medium"
                            style={{ color: item.areaColor || "#5E52C9" }}
                          >
                            {item.routineName}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <span className="text-xs font-semibold text-[#3F8F6B] bg-[#44664B]/10 px-2.5 py-0.5 rounded-full">
                            Done
                          </span>
                        ) : isNext ? (
                          <button
                            onClick={() => setTimerSession(item)}
                            className="text-xs font-semibold text-[#1C1A26] bg-[#D6CBFA]/40 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-[#D6CBFA]/70"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {item.startTime || "Next"}
                          </button>
                        ) : item.startTime ? (
                          <span className="text-xs font-medium text-text-2/80 bg-black/5 px-2 py-0.5 rounded-md">
                            {item.startTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Pinned Tasks */}
                {todayTasks.map((task) => {
                  const isDone = !!task.doneAt;
                  return (
                    <div
                      key={task.id}
                      className={`luma-card p-3.5 flex items-center justify-between gap-3 ${
                        isDone ? "opacity-60 bg-[#FFFFFF]/60" : "bg-white"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.title)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isDone
                            ? "bg-[#3F8F6B] border-[#3F8F6B] text-white"
                            : "border-text-2/40 hover:border-accent"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm font-semibold truncate block ${
                            isDone ? "line-through text-text-2" : "text-ink"
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.notes && (
                          <span className="text-xs text-text-2 truncate block mt-0.5">
                            {task.notes}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10">
                        Task
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links & Reset Today */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/todo"
                className="luma-card p-3.5 flex items-center justify-between text-ink hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-ink">
                    To-do list · {todayTasks.length}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-2" />
              </Link>

              {/* Reset Today Banner (Canvas Screen 1 & 13) */}
              <div className="bg-[#1C1A26] text-white rounded-2xl p-4 flex items-center justify-between border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Feeling stacked up?
                  </h4>
                  <p className="text-xs text-white/70 mt-0.5">
                    Reset today in under a minute
                  </p>
                </div>
                <button
                  onClick={() => setResetModalOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0"
                >
                  Reset →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSaved={() => {}}
      />
      <RoutineModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        onSaved={() => {}}
      />
      <ResetTodayModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        sessions={scheduledList}
        onApplied={() => showUndoToast("Today reset · Lightened schedule")}
      />
      <FocusTimerModal
        isOpen={!!timerSession}
        onClose={() => setTimerSession(null)}
        session={timerSession}
        onCompleted={() => {
          if (timerSession) {
            showUndoToast(`Completed ${timerSession.templateName}`);
          }
        }}
      />
    </AppShell>
  );
}
