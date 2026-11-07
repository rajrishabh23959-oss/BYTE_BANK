import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, RefreshCw, History } from 'lucide-react';
import StatusChip from './StatusChip';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  accountNo?: string;
  accountStatus?: string;
  badge?: React.ReactNode;
  backLink?: { href: string; label: string };
  actions?: React.ReactNode;
  showDefaultCustomerActions?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  accountNo,
  accountStatus,
  badge,
  backLink,
  actions,
  showDefaultCustomerActions = false,
}: PageHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
      <div className="space-y-2">
        {backLink && (
          <div>
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B4FFF] hover:text-[#0A3FD1] transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLink.label}</span>
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {accountNo && (
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#EEF3FF] text-[#0B4FFF] border border-[#D9E4FF]">
              {accountNo}
            </span>
          )}

          {accountStatus && (
            <StatusChip status={accountStatus} />
          )}

          {badge}
        </div>

        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1B0B5C] tracking-tight leading-snug">
            {title}
          </h1>
          {subtitle && (
            <div className="text-sm text-[#6B7090] mt-1 font-normal leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {actions}

        {showDefaultCustomerActions && (
          <>
            <Link
              href="/customer/transfer"
              className="h-11 px-5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs inline-flex items-center gap-2 shadow-[0_6px_20px_-2px_rgba(11,79,255,0.35)] hover:-translate-y-0.5 transition-all shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Send Assets</span>
            </Link>

            <Link
              href="/customer/swap"
              className="h-11 px-5 rounded-full bg-white border border-[#0B4FFF] text-[#0B4FFF] hover:bg-[#EEF3FF] font-semibold text-xs inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Swap (Simulated)</span>
            </Link>

            <Link
              href="/customer/history"
              className="h-11 px-5 rounded-full bg-white border border-[#D5DBEE] text-[#2B2F4A] hover:bg-[#F6F8FF] font-semibold text-xs inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all shrink-0"
            >
              <History className="w-4 h-4 text-[#6B7090]" />
              <span>Statement</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

