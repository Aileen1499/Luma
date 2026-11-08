"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LUMA error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F7F1E8]">
      <div className="luma-card p-6 max-w-sm w-full flex flex-col items-center">
        <h2 className="font-display text-xl font-bold text-ink mb-2">
          Something went wrong
        </h2>
        <p className="text-xs text-text-2 mb-4 leading-relaxed">
          {error?.message || "An unexpected error occurred while loading this view."}
        </p>
        <button
          onClick={() => reset()}
          className="luma-button-primary w-full py-2.5 text-xs"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
