"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw, Check, Sparkles } from "lucide-react";
import { completeScheduledSession } from "@/lib/db/repository";

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    templateName: string;
    routineName: string;
    minutes: number;
    tinyMinutes?: number;
  } | null;
  onCompleted: () => void;
}

export function FocusTimerModal({
  isOpen,
  onClose,
  session,
  onCompleted,
}: FocusTimerModalProps) {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompletedView, setIsCompletedView] = useState(false);

  useEffect(() => {
    if (session) {
      const initialSeconds = (session.minutes || 25) * 60;
      setTotalSeconds(initialSeconds);
      setSecondsRemaining(initialSeconds);
      setIsRunning(false);
      setIsCompletedView(false);
    }
  }, [session, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      setIsCompletedView(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  if (!isOpen || !session) return null;

  const handleSelectDuration = (minutes: number) => {
    setIsRunning(false);
    setTotalSeconds(minutes * 60);
    setSecondsRemaining(minutes * 60);
  };

  const handleMarkDone = async () => {
    const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsRemaining) / 60));
    await completeScheduledSession(session.id, elapsedMinutes);
    onCompleted();
    setIsCompletedView(true);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = Math.min(1, Math.max(0, (totalSeconds - secondsRemaining) / totalSeconds));
  const strokeDashoffset = 100 - progress * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-border flex flex-col items-center text-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-border/80 mb-6">
          <div className="text-left">
            <span className="text-[11px] font-semibold text-text-2 block uppercase tracking-wider">
              Focusing on
            </span>
            <span className="text-xs font-bold text-ink truncate max-w-[200px] block">
              {session.routineName} · {session.templateName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-text-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCompletedView ? (
          <>
            {/* Circular Progress Timer */}
            <div className="relative w-48 h-48 my-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-[#F7F1E8]"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-[#5E52C9] transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="276.4"
                  strokeDashoffset={276.4 * (1 - progress)}
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="font-display text-4xl font-bold text-ink tracking-tight">
                  {timeFormatted}
                </span>
                <span className="text-xs text-text-2 mt-1">
                  of {Math.round(totalSeconds / 60)} min
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => handleSelectDuration(5)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  totalSeconds === 300
                    ? "bg-[#1C1A26] text-white"
                    : "bg-[#F7F1E8] text-ink hover:bg-black/5"
                }`}
              >
                5m (Tiny)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDuration(session.minutes || 25)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  totalSeconds === (session.minutes || 25) * 60
                    ? "bg-[#1C1A26] text-white"
                    : "bg-[#F7F1E8] text-ink hover:bg-black/5"
                }`}
              >
                {session.minutes || 25}m
              </button>
              <button
                type="button"
                onClick={() => handleSelectDuration(45)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  totalSeconds === 2700
                    ? "bg-[#1C1A26] text-white"
                    : "bg-[#F7F1E8] text-ink hover:bg-black/5"
                }`}
              >
                45m
              </button>
            </div>

            {/* Timer Controls */}
            <div className="w-full grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setSecondsRemaining(totalSeconds);
                  setIsRunning(false);
                }}
                className="luma-button-secondary py-3 text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="luma-button-primary py-3 text-xs flex items-center justify-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Start
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleMarkDone}
              className="text-xs font-semibold text-accent hover:underline py-2"
            >
              Mark done now without waiting
            </button>

            <p className="text-[11px] text-text-2/70 mt-2">
              The timer is optional. You can mark a task done anytime.
            </p>
          </>
        ) : (
          /* Completion Screen (Canvas Screen 15) */
          <div className="py-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#3F8F6B] text-white flex items-center justify-center mb-4">
              <Check className="w-8 h-8" strokeWidth={3} />
            </div>

            <h2 className="font-display text-2xl text-ink font-semibold mb-1">
              Session complete
            </h2>
            <p className="text-xs text-text-2 mb-6">
              {Math.round(totalSeconds / 60)} minutes of focused {session.templateName}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#44664B]/10 text-[#44664B] text-xs font-bold mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              In Rhythm
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={onClose}
                className="luma-button-primary w-full py-3 text-xs"
              >
                Close & Return
              </button>
              <button
                onClick={() => {
                  setIsCompletedView(false);
                  setSecondsRemaining(25 * 60);
                  setTotalSeconds(25 * 60);
                }}
                className="luma-button-secondary w-full py-2.5 text-xs"
              >
                Another 25 min
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
