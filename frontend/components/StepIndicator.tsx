
import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { ProcessingStep } from '../types';

interface StepIndicatorProps {
  steps: ProcessingStep[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps }) => {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {step.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-500" />}
            {step.status === 'active' && <Loader2 size={18} className="text-cyan-600 dark:text-cyan-400 animate-spin" />}
            {step.status === 'pending' && <Circle size={18} className="text-slate-300 dark:text-slate-700" />}
            {step.status === 'error' && <Circle size={18} className="text-red-500" />}
          </div>
          <span className={`text-xs font-medium transition-colors duration-300 ${
            step.status === 'active' ? 'text-slate-900 dark:text-white font-bold' : 
            step.status === 'completed' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'
          }`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};
