"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, Check } from "lucide-react";
import { createRoutine } from "@/lib/db/repository";

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function RoutineModal({ isOpen, onClose, onSaved }: RoutineModalProps) {
  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [duration, setDuration] = useState(25);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // M-F default
  const [startTime, setStartTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const daysConfig = [
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
    { label: "S", value: 7 },
  ];

  const durationPresets = [15, 20, 25, 35, 45, 60];

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createRoutine({
        name: name.trim(),
        templateName: templateName.trim() || name.trim(),
        defaultMinutes: duration,
        tinyMinutes: 5,
        days: selectedDays,
        startTime: startTime || null,
        weeklyTarget: selectedDays.length,
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
            Create a Routine
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
              Routine Group Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Mandarin Study, Strength, Skincare"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!templateName) setTemplateName(e.target.value);
              }}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              Primary Session Name
            </label>
            <input
              type="text"
              placeholder="e.g. Vocabulary review, Upper body"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-accent text-ink placeholder:text-text-2/40 text-sm font-medium"
            />
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Duration ({duration} min)
            </label>
            <div className="flex flex-wrap gap-2">
              {durationPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDuration(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    duration === preset
                      ? "bg-[#1C1A26] text-white"
                      : "bg-[#F7F1E8] text-ink hover:bg-black/10"
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Days */}
          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Schedule Days ({selectedDays.length}× a week)
            </label>
            <div className="flex items-center justify-between gap-1 max-w-sm">
              {daysConfig.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`w-10 h-10 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-[#1C1A26] text-white"
                        : "bg-[#F7F1E8] text-text-2 hover:bg-black/10"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-1.5">
              Preferred Time (optional)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
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
              disabled={!name.trim() || isSubmitting}
              className="luma-button-primary py-2.5 px-5 text-xs disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create Routine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

