"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getTasks, toggleTaskComplete } from "@/lib/db/repository";
import type { Task } from "@/lib/db/types";
import { toISODate } from "@/lib/i18n/format";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { TaskModal } from "@/components/TaskModal";
import { useToast } from "@/components/Toast";
import { CheckSquare, Check, AlignLeft, Plus } from "lucide-react";

export default function TodoPage() {
  const [tab, setTab] = useState<"today" | "upcoming" | "someday">("today");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { showUndoToast } = useToast();

  const todayStr = toISODate(new Date());

  const tasks = useLiveQuery(() => getTasks(false), []);
  const allTasks = tasks || [];

  const openTasks = allTasks.filter((t) => !t.doneAt);
  const doneTasks = allTasks.filter((t) => !!t.doneAt);

  // Filter based on tab
  const filteredTasks = allTasks.filter((t) => {
    if (tab === "today") {
      return t.pinnedToday || t.dueDate === todayStr;
    }
    if (tab === "upcoming") {
      return t.dueDate && t.dueDate > todayStr;
    }
    // Someday: no due date or past uncompleted
    return !t.dueDate && !t.pinnedToday;
  });

  const handleToggle = async (task: Task) => {
    const isDone = await toggleTaskComplete(task.id);
    if (isDone) {
      showUndoToast(`Completed task: ${task.title}`);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        {/* Title */}
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            To-do
          </h1>
          <p className="text-xs text-text-2 mt-0.5">
            {openTasks.length} open · separate from your routines
          </p>
        </div>

        {/* Tabs: Today, Upcoming, Someday */}
        <div className="flex p-1 bg-white/70 rounded-2xl border border-border">
          {(["today", "upcoming", "someday"] as const).map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  isActive
                    ? "bg-[#1C1A26] text-white"
                    : "text-text-2 hover:text-ink"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Task list or Empty state */}
        {filteredTasks.length === 0 ? (
          <div className="my-8">
            <EmptyState
              icon={CheckSquare}
              title="Nothing here"
              message="Add a task when something comes to mind."
              primaryActionLabel="+ Add a task"
              onPrimaryAction={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredTasks.map((task) => {
              const isDone = !!task.doneAt;
              return (
                <div
                  key={task.id}
                  className={`luma-card p-4 flex items-center justify-between gap-3 transition-colors ${
                    isDone ? "opacity-60 bg-white/60" : "bg-white"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(task)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? "bg-[#3F8F6B] border-[#3F8F6B] text-white"
                        : "border-text-2/40 hover:border-accent"
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div
                    onClick={() => {
                      setEditingTask(task);
                      setTaskModalOpen(true);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`text-sm font-semibold truncate block ${
                        isDone ? "line-through text-text-2" : "text-ink"
                      }`}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {task.dueDate && (
                        <span className="text-[11px] text-text-2">
                          {task.dueDate === todayStr ? "Today" : task.dueDate}
                        </span>
                      )}
                      {task.pinnedToday && (
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.2 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>
                  </div>

                  {task.notes && (
                    <AlignLeft className="w-4 h-4 text-text-2/60 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-text-2/70 text-center mt-2">
          Tap a task to add notes. The lines icon means it has some.
        </p>

        {/* Quick Add Bar */}
        <div
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          className="luma-card p-3.5 flex items-center justify-between text-text-2 cursor-pointer hover:border-accent mt-4 bg-white/80"
        >
          <span className="text-xs font-medium">Add a task…</span>
          <div className="w-7 h-7 rounded-full bg-[#1C1A26] text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSaved={() => {}}
      />
    </AppShell>
  );
}

