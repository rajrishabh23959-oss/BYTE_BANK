import React from 'react';

interface SectionCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)] p-5 sm:p-6 transition-all ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#EEF1FA]">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-bold text-[#1B0B5C] tracking-tight leading-snug">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#6B7090] mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

