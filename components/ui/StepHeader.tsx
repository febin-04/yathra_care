import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface StepHeaderProps {
  title: string;
  stepCurrent?: number;
  stepTotal?: number;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  title,
  stepCurrent,
  stepTotal,
  subtitle,
  onBack,
  className = '',
}) => {
  return (
    <div className={`bg-mobile-header text-white p-5 sm:p-6 rounded-b-3xl sm:rounded-2xl shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div />
        )}

        {stepCurrent && stepTotal && (
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white">
            Step {stepCurrent} of {stepTotal}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-blue-100 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StepHeader;
