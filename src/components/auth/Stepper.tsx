import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
}

export default function Stepper({ currentStep }: StepperProps) {
  const steps = [
    { number: 1, label: 'Profile' },
    { number: 2, label: 'Simulated KYC' },
  ];

  return (
    <div
      role="list"
      aria-label="Registration Progress"
      className="relative w-full max-w-sm mx-auto mb-8"
    >
      <div className="absolute top-4 left-1/4 right-1/4 h-[3px] bg-[#D5DBEE] -translate-y-1/2 z-0">
        <div
          className="h-full bg-[#0B4FFF] transition-all duration-500 ease-in-out"
          style={{ width: currentStep > 1 ? '100%' : '0%' }}
        />
      </div>

      <div className="relative z-10 flex justify-between">
        {steps.map((s) => {
          const isCompleted = currentStep > s.number;
          const isActive = currentStep === s.number;

          return (
            <div
              key={s.number}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#1FD6A0] text-white shadow-sm'
                    : isActive
                    ? 'bg-[#0B4FFF] text-white shadow-sm'
                    : 'bg-white border-2 border-[#D5DBEE] text-[#6B7090]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{s.number}</span>
                )}
              </div>

              <span
                className={`text-[13px] font-medium mt-2 text-center transition-colors ${
                  isActive || isCompleted ? 'text-[#1B0B5C]' : 'text-[#6B7090]'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

