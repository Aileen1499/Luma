"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Pin, CheckSquare } from "lucide-react";
import { createTask, updateTask, deleteTask } from "@/lib/db/repository";
import type { Task } from "@/lib/db/types";
import { toISODate } from "@/lib/i18n/format";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSaved: () => void;
  defaultDate?: string;
}

export function TaskModal({
  isOpen,
  onClose,
  task,
  onSaved,
  defaultDate,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [pinnedToday, setPinnedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
      setDueDate(task.dueDate || "");
      setPinnedToday(task.pinnedToday);
    } else {
      setTitle("");
      setNotes("");
      setDueDate(defaultDate || toISODate(new Date()));
      setPinnedToday(true);
    }
  }, [task, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (task) {
        await updateTask(task.id, {
          title: title.trim(),
          notes: notes.trim() || undefined,
          dueDate: dueDate || null,
          pinnedToday,
        });
      } else {
        await createTask({
          title: title.trim(),
          notes: notes.trim() || undefined,
          dueDate: dueDate || null,
          pinnedToday,
        });
      }
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm("Delete this task?")) {
      await deleteTask(task.id);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 border border-border flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h2 className="font-display text-xl text-ink font-semibold">
            {task ? "Edit Task" : "Add Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-text-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Reply to Prof. Lin about class"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add details, questions, or context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-ink focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-[#F7F1E8]/40 self-end">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-accent" />
                Pin to Today
              </span>
              <input
                type="checkbox"
                checked={pinnedToday}
                onChange={(e) => setPinnedToday(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-2">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs font-semibold text-red-600 hover:text-red-700 py-2.5 px-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="luma-button-secondary py-2.5 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="luma-button-primary py-2.5 px-5 text-xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

