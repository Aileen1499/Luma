"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getSettings, updateSettings } from "@/lib/db/repository";
import {
  exportLumaBackup,
  importLumaBackup,
  clearAllLumaData,
} from "@/lib/db/exportImport";
import { toISODate } from "@/lib/i18n/format";
import { AppShell } from "@/components/AppShell";
import {
  User,
  Calendar,
  Globe,
  Download,
  Upload,
  Trash2,
  Target,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function MePage() {
  const settings = useLiveQuery(() => getSettings(), []);
  const [displayName, setDisplayName] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName || "");
    }
  }, [settings]);

  const handleSaveName = async () => {
    if (!settings) return;
    await updateSettings({ displayName: displayName.trim() });
    alert("Profile name updated.");
  };

  const handleWeekStartChange = async (val: 0 | 1 | 6) => {
    await updateSettings({ weekStart: val });
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportLumaBackup();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `luma-backup-${toISODate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importLumaBackup(content);
      setImportStatus(res.message);
      if (res.success) {
        setTimeout(() => window.location.reload(), 1200);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (
      confirm(
        "Are you sure you want to permanently clear all data? This cannot be undone unless you have a JSON backup."
      )
    ) {
      await clearAllLumaData();
      alert("All local data cleared.");
      window.location.reload();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Me & Settings
          </h1>
          <p className="text-xs text-text-2 mt-0.5">
            Personal preferences & local data backup
          </p>
        </div>

        {/* Profile Card */}
        <div className="luma-card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1C1A26] text-white flex items-center justify-center font-bold text-lg">
              {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-text-2 uppercase tracking-wider block">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={handleSaveName}
                className="w-full text-base font-semibold text-ink bg-transparent border-b border-border focus:border-accent focus:outline-none py-1"
              />
            </div>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/goals"
            className="luma-card p-4 flex items-center gap-3 text-ink hover:border-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E3A94B]/15 text-[#8D5800] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink">Goals</span>
              <span className="block text-[10px] text-text-2">Life Architecture</span>
            </div>
          </Link>

          <Link
            href="/todo"
            className="luma-card p-4 flex items-center gap-3 text-ink hover:border-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink">To-do</span>
              <span className="block text-[10px] text-text-2">Separate tasks</span>
            </div>
          </Link>
        </div>

        {/* Preferences */}
        <div className="luma-card p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-2 uppercase tracking-wider">
            Preferences
          </h3>

          {/* Week Start */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Week starts on
            </span>

            <div className="flex p-0.5 bg-[#F7F1E8] rounded-xl border border-border">
              {[
                { label: "Mon", val: 1 as const },
                { label: "Sun", val: 0 as const },
                { label: "Sat", val: 6 as const },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => handleWeekStartChange(opt.val)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold ${
                    settings?.weekStart === opt.val
                      ? "bg-[#1C1A26] text-white"
                      : "text-text-2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-ink flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              Timezone
            </span>
            <span className="text-xs text-text-2 font-medium">
              {settings?.timezone || "UTC"}
            </span>
          </div>
        </div>

        {/* Local-First Notice & Backup */}
        <div className="luma-card p-5 flex flex-col gap-3 bg-[#F7F1E8]/40 border-dashed">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold text-ink">Local-First Storage</h4>
          </div>

          <p className="text-xs text-text-2 leading-relaxed">
            LUMA stores all your data directly inside your browser&apos;s IndexedDB on this device. No servers, no tracking, complete privacy.
          </p>

          <p className="text-[11px] text-[#7F4B34] font-medium bg-[#FBD6BD]/30 p-2 rounded-xl">
            Important: Because data is tied to this browser/device, remember to export a backup regularly.
          </p>

          {/* Backup & Restore Controls */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="luma-button-primary flex-1 py-2.5 px-3 text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Exporting…" : "Export JSON Backup"}
            </button>

            <label className="luma-button-secondary flex-1 py-2.5 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" />
              Restore from Backup
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <p className="text-xs font-semibold text-accent text-center mt-1">
              {importStatus}
            </p>
          )}
        </div>

        {/* Clear Data */}
        <div className="pt-2">
          <button
            onClick={handleClearAll}
            className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>

        <p className="text-[11px] text-text-2/60 text-center pb-8">
          LUMA Personal MVP · Version 1.0
        </p>
      </div>
    </AppShell>
  );
}

