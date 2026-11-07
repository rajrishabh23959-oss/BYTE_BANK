import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sublabel?: React.ReactNode;
  accent?: 'blue' | 'violet' | 'mint' | 'amber';
  icon?: React.ReactNode;
  actionLink?: {
    href: string;
    text: string;
  };
  className?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  sublabel,
  accent = 'blue',
  icon,
  actionLink,
  className = '',
}: StatCardProps) {
  const accentBorder = {
    blue: 'border-t-[#0B4FFF]',
    violet: 'border-t-[#8B5CF6]',
    mint: 'border-t-[#1FD6A0]',
    amber: 'border-t-[#FFAB2E]',
  }[accent];

  const accentChipBg = {
    blue: 'bg-[#EEF3FF] text-[#0B4FFF]',
    violet: 'bg-[#F5F0FF] text-[#8B5CF6]',
    mint: 'bg-[#E6FBF4] text-[#0E9F73]',
    amber: 'bg-[#FFF6E9] text-[#D97706]',
  }[accent];

  return (
    <div
      className={`relative bg-white rounded-2xl border border-[#E8ECF6] border-t-4 ${accentBorder} shadow-[0_8px_30px_rgba(27,11,92,0.08)] p-5 sm:p-6 flex flex-col justify-between transition-all hover:shadow-[0_12px_36px_rgba(27,11,92,0.12)] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#6B7090]">{label}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accentChipBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="text-[30px] sm:text-[32px] font-bold text-[#1B0B5C] tracking-tight tabular-nums leading-none">
          {value}
          {unit && <span className="text-xs font-normal text-[#6B7090] ml-1.5">{unit}</span>}
        </div>

        {sublabel && (
          <div className="text-xs text-[#6B7090] mt-2 font-normal leading-relaxed">
            {sublabel}
          </div>
        )}

        {actionLink && (
          <div className="mt-2.5">
            <Link
              href={actionLink.href}
              className="text-xs font-semibold text-[#0B4FFF] hover:text-[#0A3FD1] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{actionLink.text}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

