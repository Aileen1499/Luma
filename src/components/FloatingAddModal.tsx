"use client";

import React, { useState } from "react";
import { Plus, CheckSquare, RotateCcw, Target, X } from "lucide-react";
import { TaskModal } from "./TaskModal";
import { RoutineModal } from "./RoutineModal";
import { GoalModal } from "./GoalModal";

interface FloatingAddModalProps {
  onRefresh: () => void;
}

export function FloatingAddModal({ onRefresh }: FloatingAddModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  return (
    <>
      {/* Floating Add Action Button */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Add Item"
          className="w-14 h-14 rounded-full bg-[#1C1A26] text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" strokeWidth={2.4} />}
        </button>
      </div>

      {/* Choice Sheet Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-5 border border-border flex flex-col gap-2.5 mb-24 sm:mb-0 animate-in slide-in-from-bottom-4 duration-150"
          >
            <h3 className="text-xs font-bold text-text-2 uppercase tracking-wider px-2 py-1">
              Add to LUMA
            </h3>

            <button
              onClick={() => {
                setIsOpen(false);
                setTaskModalOpen(true);
              }}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F7F1E8]/70 active:bg-[#F7F1E8] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-ink">Add a Task</span>
                <span className="block text-xs text-text-2">One-off to-do, with notes & due date</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setRoutineModalOpen(true);
              }}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F7F1E8]/70 active:bg-[#F7F1E8] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#44664B]/10 text-[#44664B] flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-ink">Create a Routine</span>
                <span className="block text-xs text-text-2">Recurring weekly sessions & study plans</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setGoalModalOpen(true);
              }}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F7F1E8]/70 active:bg-[#F7F1E8] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E3A94B]/15 text-[#8D5800] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-ink">Add a Goal</span>
                <span className="block text-xs text-text-2">Big milestone or outcome to track</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Sub Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSaved={onRefresh}
      />
      <RoutineModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        onSaved={onRefresh}
      />
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSaved={onRefresh}
      />
    </>
  );
}

