'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import WaveDivider from '@/components/ui/WaveDivider';

export default function BetaDropCTA() {
  return (
    <section className="relative w-full bg-[#F3F7FF] py-20 overflow-hidden">
      <WaveDivider fill="#F3F7FF" direction="up" className="absolute top-0 left-0 w-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 pt-4 pb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
          START MANAGING DIGITAL ASSETS WITH BYTEBANK
        </h2>

        <p className="text-base text-[#6B7090] max-w-xl mx-auto leading-relaxed">
          Test live ACID transfers, verify double-entry invariants, or launch the DBMS Concurrency Lab.
          No real funds, pure database engineering.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="btn-pill-primary px-9 py-4 text-base"
          >
            Get Started
          </Link>
          <Link
            href="/admin/lab"
            className="px-7 py-3.5 rounded-full bg-white border border-[#E8ECF6] shadow-card-white text-[#1B0B5C] font-semibold text-sm hover:border-[#0B4FFF] transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#0B4FFF]" />
            <span>Open Concurrency Lab</span>
          </Link>
        </div>
      </div>

      <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
    </section>
  );
}
