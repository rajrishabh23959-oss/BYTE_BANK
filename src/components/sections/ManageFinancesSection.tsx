'use client';

import React from 'react';
import WaveDivider from '@/components/ui/WaveDivider';
import MintDotGrid from '@/components/ui/MintDotGrid';
import MiniTrendChart from '@/components/charts/MiniTrendChart';

interface ManageFinancesSectionProps {
  metrics: {
    totalAccounts: number;
    totalTransactions: number;
    totalLedgerEntries: number;
    recentTransactions: {
      transaction_id: number;
      type: string;
      quantity: string;
      status: string;
      symbol: string;
      sender_name?: string;
      created_at: string;
    }[];
  } | null;
}

export default function ManageFinancesSection({ metrics }: ManageFinancesSectionProps) {
  const transactions = metrics?.recentTransactions && metrics.recentTransactions.length > 0
    ? metrics.recentTransactions
    : [
        { transaction_id: 1, sender_name: 'Rishi Sharma', symbol: 'BTC', quantity: '0.10000000', status: 'Completed', created_at: 'Today, 10:45 AM' },
        { transaction_id: 2, sender_name: 'Rahul Verma', symbol: 'ETH', quantity: '1.50000000', status: 'Completed', created_at: 'Today, 09:12 AM' },
        { transaction_id: 3, sender_name: 'Priya Patel', symbol: 'SOL', quantity: '4.250000', status: 'Completed', created_at: 'Yesterday, 04:30 PM' },
        { transaction_id: 4, sender_name: 'Neha Singh', symbol: 'TCS', quantity: '10.00000000', status: 'Completed', created_at: 'Yesterday, 02:15 PM' },
      ];

  const accountsCount = metrics?.totalAccounts || 127;
  const ledgerCount = metrics?.totalLedgerEntries || 1752;

  return (
    <section className="relative w-full bg-[#F3F7FF] py-20 overflow-hidden">
      <WaveDivider fill="#F3F7FF" direction="up" className="absolute top-0 left-0 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[460px]">
              <MintDotGrid
                cols={7}
                rows={5}
                className="absolute -bottom-8 -left-8 z-0"
              />

              <div className="relative z-10 bg-white rounded-2xl border border-[#E8ECF6] shadow-card-white p-6 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#6B7090] mb-2">
                  Asset Inflow Trends
                </div>
                <MiniTrendChart />
              </div>

              <div className="relative z-20 bg-white rounded-2xl border border-[#E8ECF6] shadow-card-elevated p-6 -mt-10 ml-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1B0B5C] mb-4">
                  Transaction History
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((tx, idx) => {
                    const initials = (tx.sender_name || 'BB')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 text-xs border-b border-[#F3F7FF] pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#3B5BFF] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1B0B5C]">
                              {tx.sender_name || 'System Allocation'}
                            </div>
                            <div className="text-[10px] text-[#6B7090]">
                              {new Date(tx.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-[#1B0B5C]">
                            {tx.quantity} {tx.symbol}
                          </div>
                          <span className="inline-block text-[10px] font-semibold text-[#1FD6A0]">
                            Completed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight uppercase font-sans">
                MANAGE YOUR FINANCES
              </h2>
              <p className="text-base text-[#6B7090] leading-relaxed max-w-lg">
                Real-time balance derivation where every customer holding is guaranteed by paired signed ledger entries.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight font-sans">
                  {accountsCount.toLocaleString()}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7090]">
                  Master Customer Accounts
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight font-sans">
                  {ledgerCount.toLocaleString()}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7090]">
                  Verified Ledger Entries
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
    </section>
  );
}

