'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MarketingFooter() {
  return (
    <footer className="w-full bg-[#1A0050] text-slate-300 text-xs pt-16 pb-12 overflow-hidden border-t border-[#26056B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <Image
                  src="/bytebank-icon.svg"
                  alt="ByteBank Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white uppercase font-sans">
                Byte<span className="text-[#3B5BFF]">Bank</span>
              </span>
            </Link>

            <p className="text-slate-300 text-sm font-medium pt-1 max-w-sm">
              Get your first digital wallet in ByteBank.
            </p>

            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] leading-relaxed max-w-md">
              <span className="font-bold text-[#1FD6A0] uppercase block mb-0.5">Disclaimer</span>
              Simulation only: balances and KYC data are synthetic.
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              Platform
            </div>
            <ul className="space-y-2 text-sm text-slate-300 font-medium">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/download" className="hover:text-white transition-colors">
                  Download Data Pack
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About ByteBank
                </Link>
              </li>
              <li>
                <Link href="/customer/dashboard" className="hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              Database Engineering
            </div>
            <ul className="space-y-2 text-sm text-slate-300 font-medium">
              <li>
                <Link href="/admin/lab" className="hover:text-white transition-colors">
                  DBMS Concurrency Lab
                </Link>
              </li>
              <li>
                <Link href="/auditor/reconciliation" className="hover:text-white transition-colors">
                  Reconciliation Worker
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  ACID Transaction Architecture
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Staff Role Authentication
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div>
            &copy; {new Date().getFullYear()} ByteBank. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>PostgreSQL 16 Engine</span>
            <span>&bull;</span>
            <span>ACID Invariant Verification</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
