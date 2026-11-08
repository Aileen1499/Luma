"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, RotateCcw, BarChart2, User, Compass } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Today", href: "/today", icon: Compass },
    { label: "Planner", href: "/planner", icon: Calendar },
    { label: "Routines", href: "/routines", icon: RotateCcw },
    { label: "Progress", href: "/progress", icon: BarChart2 },
    { label: "Me", href: "/me", icon: User },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <div className="bg-[#1C1A26] text-white/70 rounded-full px-3 py-2 flex items-center justify-around gap-1 sm:gap-2 border border-white/10 pointer-events-auto w-full max-w-[360px]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-colors min-w-[56px] text-center ${
                isActive
                  ? "bg-white/15 text-white font-semibold"
                  : "hover:text-white/90"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.3 : 1.8} />
              <span className="text-[10px] tracking-wide font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

