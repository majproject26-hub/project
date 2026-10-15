import React from 'react';
import { Check } from 'lucide-react';

export function Stepper({ steps = [], currentStep = 0, onStepClick, className = '' }) {
  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isClickable = onStepClick && idx <= currentStep;

          return (
            <React.Fragment key={idx}>
              <div
                onClick={() => isClickable && onStepClick(idx)}
                className={`flex flex-col items-center gap-1.5 relative z-10 ${
                  isClickable ? 'cursor-pointer group' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border-2 ${
                    isCompleted
                      ? 'bg-[#748447] border-[#748447] text-[#F7F4E8] shadow-sm shadow-[#748447]/20'
                      : isCurrent
                      ? 'bg-[#4D5A2A] border-[#4D5A2A] text-[#F7F4E8] ring-4 ring-[#4D5A2A]/20 shadow-md shadow-[#4D5A2A]/30'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-medium text-center hidden sm:block ${
                    isCurrent
                      ? 'text-[#4D5A2A] dark:text-[#DCE4C2] font-semibold'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-200 ${
                    idx < currentStep
                      ? 'bg-[#748447] dark:bg-[#748447]'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="sm:hidden text-center mt-2">
        <span className="text-xs font-semibold text-[#4D5A2A] dark:text-[#DCE4C2]">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </span>
      </div>
    </div>
  );
}
