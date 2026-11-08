"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  footerHint?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  footerHint,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="luma-card w-full p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Soft rounded icon ring */}
        <div className="w-12 h-12 rounded-full bg-[#5E52C9]/10 text-[#5E52C9] flex items-center justify-center mb-4">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>

        <h3 className="font-display text-xl sm:text-2xl text-ink font-semibold mb-2">
          {title}
        </h3>

        <p className="text-text-2 text-sm leading-relaxed mb-6 max-w-xs">
          {message}
        </p>

        <div className="w-full flex flex-col gap-2.5 max-w-xs">
          {primaryActionLabel && onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="luma-button-primary w-full py-3 px-4 text-sm"
            >
              {primaryActionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="luma-button-secondary w-full py-3 px-4 text-sm"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>

      {footerHint && (
        <p className="text-xs text-text-2/70 mt-4 text-center px-4">
          {footerHint}
        </p>
      )}
    </div>
  );
}

