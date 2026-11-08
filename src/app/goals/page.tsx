"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getGoals, deleteGoal } from "@/lib/db/repository";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GoalModal } from "@/components/GoalModal";
import { Target, Plus, Trash2, Calendar } from "lucide-react";

export default function GoalsPage() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const goals = useLiveQuery(() => getGoals(), []);
  const allGoals = goals || [];

  const handleDelete = async (id: string) => {
    if (confirm("Delete this goal?")) {
      await deleteGoal(id);
    }
  };

  const isEmpty = allGoals.length === 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Goals
            </h1>
            <p className="text-xs text-text-2 mt-0.5">
              {allGoals.length} active · each has its own program
            </p>
          </div>

          {!isEmpty && (
            <button
              onClick={() => setGoalModalOpen(true)}
              className="luma-button-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Goal
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="my-8">
            <EmptyState
              icon={Target}
              title="Add a goal to start tracking your progress"
              message="Goals connect to routines, so your daily actions move them forward."
              primaryActionLabel="Add goal"
              onPrimaryAction={() => setGoalModalOpen(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allGoals.map((goal) => (
              <div key={goal.id} className="luma-card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {goal.title}
                    </h3>
                    {goal.notes && (
                      <p className="text-xs text-text-2 mt-1">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 rounded-full hover:bg-red-50 text-text-2 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {goal.targetDate && (
                  <div className="flex items-center gap-1.5 text-xs text-text-2/80 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    Target: {goal.targetDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSaved={() => {}}
      />
    </AppShell>
  );
}
