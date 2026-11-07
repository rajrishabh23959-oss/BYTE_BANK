import React from 'react';

export type StatusVariant =
  | 'active'
  | 'frozen'
  | 'success'
  | 'failed'
  | 'rejected'
  | 'pending'
  | 'verified'
  | 'allow'
  | 'require_extra_confirmation'
  | 'reject'
  | 'open'
  | 'resolved'
  | 'investigating'
  | 'debit'
  | 'credit'
  | string;

interface StatusChipProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusChip({ status, label, size = 'md', className = '' }: StatusChipProps) {
  const norm = (status || '').toLowerCase().trim();

  let colorClasses = 'bg-[#EEF3FF] text-[#0B4FFF] border-[#D9E4FF]';

  if (
    norm === 'active' ||
    norm === 'success' ||
    norm === 'verified' ||
    norm === 'allow' ||
    norm === 'resolved' ||
    norm === 'credit'
  ) {
    colorClasses = 'bg-[#E6FBF4] text-[#0E9F73] border-[#B2F5DE]';
  } else if (
    norm === 'frozen' ||
    norm === 'failed' ||
    norm === 'rejected' ||
    norm === 'reject' ||
    norm === 'debit'
  ) {
    colorClasses = 'bg-[#FFE9EF] text-[#D6204F] border-[#FED0DC]';
  } else if (
    norm === 'pending' ||
    norm === 'require_extra_confirmation' ||
    norm === 'open' ||
    norm === 'investigating'
  ) {
    colorClasses = 'bg-[#FFF4DD] text-[#B7791F] border-[#FDE6B0]';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const displayLabel = label || status?.toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center font-bold tracking-wide rounded-full border ${sizeClasses} ${colorClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
}

