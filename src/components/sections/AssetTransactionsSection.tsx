'use client';

import React from 'react';
import MintDotGrid from '@/components/ui/MintDotGrid';

interface AssetTransactionsSectionProps {
  metrics: {
    totalAccounts: number;
    totalTransactions: number;
    totalLedgerEntries: number;
    supportedAssetsCount: number;
    topAssets: {
      symbol: string;
      name: string;
      type: string;
      holders: number;
      total_qty: string;
    }[];
  } | null;
}

export default function AssetTransactionsSection({ metrics }: AssetTransactionsSectionProps) {
  const assets = metrics?.topAssets && metrics.topAssets.length > 0
    ? metrics.topAssets
    : [
        { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', holders: 110 },
        { symbol: 'ETH', name: 'Ethereum', type: 'crypto', holders: 95 },
        { symbol: 'SOL', name: 'Solana', type: 'crypto', holders: 78 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', type: 'stock', holders: 62 },
        { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'stock', holders: 54 },
      ];

  const instrumentsCount = metrics?.supportedAssetsCount || 10;
  const txnCount = metrics?.totalTransactions ?? 0;

  return (
    <section className="relative w-full bg-white py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight uppercase font-sans">
                ASSET TRANSACTIONS
              </h2>
              <p className="text-base text-[#6B7090] leading-relaxed max-w-lg">
                Execute instant atomic transfers across supported cryptocurrencies and simulated equities with deterministic zero-loss isolation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight font-sans">
                  {instrumentsCount}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7090]">
                  Active Database Instruments
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight font-sans">
                  {txnCount > 0 ? txnCount.toLocaleString() : '--'}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7090]">
                  Completed Transfers
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[460px]">
              <MintDotGrid
                cols={8}
                rows={5}
                className="absolute -top-6 -right-6 z-0"
              />

              <div className="relative z-10 bg-white rounded-2xl border border-[#E8ECF6] shadow-card-elevated p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#F3F7FF] mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#1B0B5C]">
                    Supported Instruments &amp; Holders
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F3F7FF] text-[#0B4FFF]">
                    PostgreSQL 16
                  </span>
                </div>

                <div className="space-y-3">
                  {assets.slice(0, 5).map((asset, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F3F7FF]/60 hover:bg-[#F3F7FF] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E8ECF6] flex items-center justify-center font-mono font-bold text-xs text-[#0B4FFF] shadow-sm">
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1B0B5C]">
                            {asset.name}
                          </div>
                          <div className="text-[10px] text-[#6B7090] font-mono uppercase">
                            {asset.symbol} • {asset.type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-[#1B0B5C] font-mono">
                          {asset.holders} holders
                        </div>
                        <div className="text-[10px] text-[#1FD6A0] font-medium">
                          Active Invariant
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
