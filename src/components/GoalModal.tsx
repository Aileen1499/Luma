"use client";

import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import { createGoal } from "@/lib/db/repository";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function GoalModal({ isOpen, onClose, onSaved }: GoalModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createGoal({
        title: title.trim(),
        notes: notes.trim() || undefined,
        targetDate: targetDate || null,
      });
      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 border border-border flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h2 className="font-display text-xl text-ink font-semibold">
            Add a Goal
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
              Goal Title
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Prepare for HSK 4, Run 3× a week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              Notes or Context (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Target score, reasons, or key milestones…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Target Date (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-ink focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
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
              {isSubmitting ? "Saving…" : "Save Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
