import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface CardProps {
  variant?: 'default' | 'summary' | 'row';
  title?: string;
  subtitle?: string;
  stepBadge?: string;
  leadingIcon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  stepBadge,
  leadingIcon,
  children,
  footer,
  onClick,
  className = '',
}) => {
  // Pattern 1: Floating Summary Card (Global Express "Travel Details / Step 1 of 2")
  if (variant === 'summary') {
    return (
      <div className={`bg-white rounded-3xl shadow-summary border border-slate-100 overflow-hidden ${className}`}>
        {/* Card Header Band */}
        <div className="bg-gradient-to-r from-desktop-hero to-desktop-cardHeader text-white p-5 flex items-center justify-between">
          <div>
            {stepBadge && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full mb-1 inline-block">
                {stepBadge}
              </span>
            )}
            {title && <h3 className="text-lg font-black tracking-tight">{title}</h3>}
          </div>
          {subtitle && <span className="text-xs font-semibold text-blue-100">{subtitle}</span>}
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">{children}</div>

        {/* Optional Footer CTA */}
        {footer && <div className="bg-slate-50 p-4 border-t border-slate-100">{footer}</div>}
      </div>
    );
  }

  // Pattern 2: YATRE Card List Row (Profile / Settings list row with leading icon + trailing chevron)
  if (variant === 'row') {
    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-4 border border-mobile-border shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer ${className}`}
      >
        <div className="flex items-center space-x-3.5">
          {leadingIcon && (
            <div className="w-10 h-10 rounded-xl bg-mobile-cardTint text-mobile-header flex items-center justify-center shrink-0 font-bold">
              {leadingIcon}
            </div>
          )}
          <div>
            {title && <h4 className="text-xs font-bold text-slate-900">{title}</h4>}
            {subtitle && <p className="text-[11px] text-mobile-subtext">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    );
  }

  // Pattern 3: Standard Content Card
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-card border border-slate-100/80 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      )}
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-slate-100">{footer}</div>}
    </div>
  );
};

export default Card;
