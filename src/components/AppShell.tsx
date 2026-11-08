"use client";

import React, { useEffect, useState } from "react";
import { BottomNav } from "./BottomNav";
import { FloatingAddModal } from "./FloatingAddModal";
import { ToastProvider } from "./Toast";
import { toISODate, getWeekDays } from "@/lib/i18n/format";
import { syncScheduleForDateRange } from "@/lib/db/scheduleGenerator";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Initial schedule sync for active routines
    const today = new Date();
    const days = getWeekDays(today, 1);
    const startStr = toISODate(days[0]);
    const endStr = toISODate(days[6]);
    syncScheduleForDateRange(startStr, endStr).catch(console.error);

    // Register service worker for PWA if supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ToastProvider>
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col px-4 pt-3 pb-safe relative">
        <main className="flex-1 flex flex-col" key={refreshKey}>
          {children}
        </main>
        <FloatingAddModal onRefresh={handleRefresh} />
        <BottomNav />
      </div>
    </ToastProvider>
  );
}

