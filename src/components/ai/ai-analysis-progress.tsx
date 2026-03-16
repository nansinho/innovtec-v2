"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileCheck,
  ScanSearch,
  BrainCircuit,
  Database,
  CheckCircle2,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiAnalysisProgressProps {
  isActive: boolean;
  isComplete: boolean;
  onAllStepsDone: () => void;
}

const STEPS = [
  {
    icon: FileCheck,
    label: "Document reçu",
    delayToNext: 1800,
  },
  {
    icon: ScanSearch,
    label: "Lecture du document...",
    delayToNext: 2500,
  },
  {
    icon: BrainCircuit,
    label: "Extraction des informations...",
    delayToNext: 3500,
  },
  {
    icon: Database,
    label: "Structuration des données...",
    delayToNext: 4000,
  },
  {
    icon: CheckCircle2,
    label: "Finalisation de l'analyse...",
    delayToNext: 0, // waits for API
  },
];

export default function AiAnalysisProgress({
  isActive,
  isComplete,
  onAllStepsDone,
}: AiAnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onAllStepsDoneRef = useRef(onAllStepsDone);
  onAllStepsDoneRef.current = onAllStepsDone;

  // Start stepping when active
  useEffect(() => {
    if (isActive && currentStep === -1) {
      setCurrentStep(0);
    }
  }, [isActive, currentStep]);

  // Auto-advance through simulated steps
  useEffect(() => {
    if (currentStep < 0 || currentStep >= STEPS.length) return;
    if (isComplete) return; // completion effect handles the rest

    const step = STEPS[currentStep];
    if (step.delayToNext > 0 && currentStep < STEPS.length - 1) {
      timeoutRef.current = setTimeout(() => {
        setCompletedSteps((prev) => new Set(prev).add(currentStep));
        setCurrentStep((prev) => prev + 1);
      }, step.delayToNext);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentStep, isComplete]);

  // Rapid completion when API returns
  useEffect(() => {
    if (!isComplete) return;

    let stepToComplete = currentStep;
    const timers: NodeJS.Timeout[] = [];

    const completeRemaining = () => {
      let delay = 0;
      for (let i = stepToComplete; i < STEPS.length; i++) {
        const idx = i;
        const timer = setTimeout(() => {
          setCompletedSteps((prev) => new Set(prev).add(idx));
          if (idx === STEPS.length - 1) {
            setCurrentStep(STEPS.length);
          }
        }, delay);
        timers.push(timer);
        delay += 250;
      }

      const finalTimer = setTimeout(() => {
        onAllStepsDoneRef.current();
      }, delay + 600);
      timers.push(finalTimer);
    };

    completeRemaining();

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const progress =
    currentStep >= STEPS.length
      ? 100
      : Math.max(0, ((completedSteps.size + (currentStep >= 0 ? 0.5 : 0)) / STEPS.length) * 100);

  return (
    <div className="animate-scale-in overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      {/* Progress bar */}
      <div className="h-1 w-full bg-[var(--border-1)]">
        <div
          className="h-full rounded-r-full bg-[var(--navy)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border-1)] px-4 py-3">
        <Sparkles className="h-4 w-4 text-[var(--yellow)]" />
        <span className="text-sm font-medium text-[var(--heading)]">
          {currentStep >= STEPS.length ? "Analyse terminée !" : "Analyse IA en cours"}
        </span>
      </div>

      {/* Steps */}
      <div className="px-4 py-4">
        <div className="space-y-0">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.has(index);
            const isCurrentStep = currentStep === index && !isCompleted;
            const isPending = index > currentStep && !isCompleted;

            return (
              <div key={index} className="flex items-stretch gap-3">
                {/* Timeline column */}
                <div className="flex w-7 flex-col items-center">
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                      isCompleted &&
                        "bg-[var(--green)] text-white",
                      isCurrentStep &&
                        "border-2 border-[var(--navy)] bg-[var(--navy)]/10 text-[var(--navy)]",
                      isPending &&
                        "border border-[var(--border-1)] bg-[var(--hover)] text-[var(--text-muted)]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 animate-scale-in" />
                    ) : (
                      <StepIcon
                        className={cn(
                          "h-3.5 w-3.5",
                          isCurrentStep && "animate-pulse"
                        )}
                      />
                    )}
                  </div>
                  {/* Connecting line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 grow transition-colors duration-500",
                        isCompleted
                          ? "bg-[var(--green)]"
                          : "bg-[var(--border-1)]"
                      )}
                      style={{ minHeight: "12px" }}
                    />
                  )}
                </div>

                {/* Label + status */}
                <div
                  className={cn(
                    "flex min-h-[40px] flex-1 items-center justify-between pb-2 transition-all duration-300",
                    isPending && "opacity-40"
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] transition-colors duration-300",
                      isCompleted && "font-medium text-[var(--green)]",
                      isCurrentStep && "font-medium text-[var(--heading)]",
                      isPending && "text-[var(--text-muted)]"
                    )}
                  >
                    {isCompleted
                      ? step.label.replace("...", "")
                      : step.label}
                  </span>
                  {isCurrentStep && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--navy)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
