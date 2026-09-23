import React from 'react';

export interface StatItem {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

export interface StatBarProps {
  stats: StatItem[];
  title?: string;
  className?: string;
}

export const StatBar: React.FC<StatBarProps> = ({ stats, title, className = '' }) => {
  return (
    <div className={`bg-desktop-navy text-white rounded-3xl p-6 sm:p-8 shadow-2xl ${className}`}>
      {title && (
        <h3 className="text-center text-sm font-extrabold uppercase tracking-widest text-blue-200 mb-6">
          {title}
        </h3>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(stats.length, 4)} gap-6 divide-y sm:divide-y-0 sm:divide-x divide-blue-800/60`}>
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center text-center p-3 ${
              idx > 0 ? 'sm:pl-6 pt-4 sm:pt-0' : ''
            }`}
          >
            {stat.icon && (
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-desktop-accent flex items-center justify-center mb-2 shadow-inner">
                {stat.icon}
              </div>
            )}
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stat.value}</span>
            <span className="text-xs font-semibold text-blue-200 mt-1">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatBar;
