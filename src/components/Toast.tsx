"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { undoLastChange } from "@/lib/db/repository";
import { RotateCcw } from "lucide-react";

interface ToastContextType {
  showUndoToast: (message: string, onUndoSuccess?: () => void) => void;
}

const ToastContext = createContext<ToastContextType>({
  showUndoToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    secondsLeft: number;
    onUndoSuccess?: () => void;
  } | null>(null);

  const showUndoToast = (message: string, onUndoSuccess?: () => void) => {
    setToast({
      id: Date.now(),
      message,
      secondsLeft: 5,
      onUndoSuccess,
    });
  };

  useEffect(() => {
    if (!toast) return;

    if (toast.secondsLeft <= 0) {
      setToast(null);
      return;
    }

    const timer = setInterval(() => {
      setToast((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const handleUndo = async () => {
    if (!toast) return;
    const success = await undoLastChange();
    if (success && toast.onUndoSuccess) {
      toast.onUndoSuccess();
    }
    setToast(null);
  };

  return (
    <ToastContext.Provider value={{ showUndoToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#1C1A26] text-white rounded-2xl p-3.5 flex items-center justify-between border border-white/10 pointer-events-auto">
            <span className="text-sm font-medium truncate mr-3">
              {toast.message}
            </span>
            <button
              onClick={handleUndo}
              className="bg-[#5E52C9] hover:bg-[#5E52C9]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 transition-opacity active:opacity-80"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo ({toast.secondsLeft}s)
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
