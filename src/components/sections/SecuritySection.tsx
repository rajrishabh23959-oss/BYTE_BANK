'use client';

import React from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import WaveDivider from '@/components/ui/WaveDivider';
import MintCheckItem from '@/components/ui/MintCheckItem';
import MintDotGrid from '@/components/ui/MintDotGrid';
import MiniTrendChart from '@/components/charts/MiniTrendChart';

const SECURITY_CHECKS = [
  'Double-entry ledger with append-only immutability',
  'PostgreSQL row-level locking (SELECT ... FOR UPDATE)',
  'Versioned rule-based risk screening before confirmation',
  'Automated reconciliation worker verifying zero drift',
  'Privacy-masked auditor views with purpose-coded logging',
];

const COMPLIANCE_PIE = [
  { name: 'Satisfied Invariants', value: 100, color: '#1FD6A0' },
];

export default function SecuritySection() {
  return (
    <section className="relative w-full bg-[#F3F7FF] py-20 overflow-hidden">
      <WaveDivider fill="#F3F7FF" direction="up" className="absolute top-0 left-0 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] tracking-tight uppercase font-sans">
                SECURITY
              </h2>
              <p className="text-base text-[#6B7090] leading-relaxed max-w-lg">
                Our relational database architecture ensures assets are protected throughout their full transaction lifecycle.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {SECURITY_CHECKS.map((text, idx) => (
                <MintCheckItem key={idx}>{text}</MintCheckItem>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/register"
                className="btn-pill-primary px-9 py-4 text-base"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[460px]">
              <MintDotGrid
                cols={8}
                rows={5}
                className="absolute -top-8 -right-6 z-0"
              />

              <div className="relative z-10 bg-white rounded-2xl border border-[#E8ECF6] shadow-card-white p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#1B0B5C]">
                    DBMS Invariant Audit
                  </div>
                  <span className="text-[11px] font-mono text-[#1FD6A0] font-semibold">
                    15/15 PASS
                  </span>
                </div>

                <div className="relative w-full h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={COMPLIANCE_PIE}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        <Cell fill="#1FD6A0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-[#1B0B5C]">
                      100%
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7090]">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-20 bg-white rounded-2xl border border-[#E8ECF6] shadow-card-elevated p-6 -mt-10 ml-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#6B7090] mb-2">
                  Continuous Ledger Verification
                </div>
                <MiniTrendChart />
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
    </section>
  );
}

