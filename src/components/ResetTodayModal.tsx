"use client";

import React, { useState } from "react";
import { X, ArrowRight, Check } from "lucide-react";
import { resetTodayProposals, EnrichedScheduledSession } from "@/lib/db/repository";
import { toISODate, parseISODate } from "@/lib/i18n/format";

interface ResetTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: EnrichedScheduledSession[];
  onApplied: () => void;
}

export function ResetTodayModal({
  isOpen,
  onClose,
  sessions,
  onApplied,
}: ResetTodayModalProps) {
  const pendingSessions = sessions.filter(
    (s) => s.state === "due_today" || s.state === "planned"
  );
  const doneSessions = sessions.filter((s) => s.state === "done");

  // Keep the first 3 by default
  const [keepIds, setKeepIds] = useState<string[]>(() =>
    pendingSessions.slice(0, 3).map((s) => s.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleKeep = (id: string) => {
    setKeepIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toISODate(tomorrow);

  const focusList = pendingSessions.filter((s) => keepIds.includes(s.id));
  const moveList = pendingSessions.filter((s) => !keepIds.includes(s.id));

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const todayStr = toISODate(new Date());
      await resetTodayProposals(todayStr, keepIds, tomorrowStr);
      onApplied();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-border flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <span className="text-[11px] font-bold text-accent tracking-widest uppercase">
            Reset Today
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-text-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="font-display text-2xl text-ink font-semibold mb-2">
          Let’s make today lighter
        </h2>

        <p className="text-text-2 text-sm leading-relaxed mb-6">
          You’ve finished {doneSessions.length} {doneSessions.length === 1 ? "thing" : "things"}. {pendingSessions.length} are left, and not all of them need to happen today.
        </p>

        {/* Focus on these */}
        <div className="mb-6">
          <span className="block text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2.5">
            Focus on these (up to 3)
          </span>

          <div className="flex flex-col gap-2">
            {focusList.map((item, index) => (
              <div
                key={item.id}
                onClick={() => toggleKeep(item.id)}
                className="luma-card p-3 flex items-center justify-between cursor-pointer hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1C1A26] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{item.templateName}</h4>
                    <span className="text-xs text-text-2">
                      {item.minutes} min {item.startTime ? `· ${item.startTime}` : ""}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-accent font-semibold px-2">Keep</span>
              </div>
            ))}

            {focusList.length === 0 && (
              <p className="text-xs text-text-2/60 italic p-3 text-center border border-dashed rounded-xl">
                Tap items below to pick up to 3 to focus on today.
              </p>
            )}
          </div>
        </div>

        {/* Move for later */}
        {moveList.length > 0 && (
          <div className="mb-6">
            <span className="block text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2.5">
              Move for later (Tomorrow)
            </span>

            <div className="flex flex-col gap-2">
              {moveList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleKeep(item.id)}
                  className="p-3 rounded-xl border border-border/80 bg-[#F7F1E8]/30 flex items-center justify-between cursor-pointer hover:border-accent"
                >
                  <div>
                    <h4 className="text-sm font-medium text-ink">{item.templateName}</h4>
                    <span className="text-xs text-text-2/70">{item.minutes} min</span>
                  </div>
                  <span className="text-xs font-medium text-[#7F4B34] bg-[#FBD6BD]/40 px-2 py-0.5 rounded-full">
                    Tomorrow
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-2 border-t border-border mt-auto">
          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="luma-button-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Applying…" : "Apply reset"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-text-2 py-2 text-center hover:text-ink transition-colors"
          >
            Keep everything as is
          </button>
        </div>
      </div>
    </div>
  );
}
