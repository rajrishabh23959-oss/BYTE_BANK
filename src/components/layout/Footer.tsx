'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A0050] text-slate-300 text-xs pt-16 pb-12 overflow-hidden border-t border-[#26056B] mt-auto">
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

            <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 max-w-md">
              <span className="font-bold text-[#1FD6A0] uppercase text-[11px] block mb-1">
                Notice
              </span>
              <p className="text-white text-[13px] leading-[1.6]">
                Simulation only: all balances, KYC data and prices are synthetic. No real funds are handled.
              </p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              Customer Terminal
            </div>
            <ul className="space-y-2 text-sm text-slate-300 font-medium">
              <li>
                <Link href="/customer/dashboard" className="hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/customer/holdings" className="hover:text-white transition-colors">
                  Asset Holdings
                </Link>
              </li>
              <li>
                <Link href="/customer/transfer" className="hover:text-white transition-colors">
                  Send &amp; Transfer
                </Link>
              </li>
              <li>
                <Link href="/customer/swap" className="hover:text-white transition-colors">
                  Simulated Swaps
                </Link>
              </li>
              <li>
                <Link href="/customer/history" className="hover:text-white transition-colors">
                  Transaction History
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              Administration &amp; Audit
            </div>
            <ul className="space-y-2 text-sm text-slate-300 font-medium">
              <li>
                <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                  Admin Control Center
                </Link>
              </li>
              <li>
                <Link href="/admin/reconciliation" className="hover:text-white transition-colors">
                  Reconciliation Engine
                </Link>
              </li>
              <li>
                <Link href="/admin/lab" className="hover:text-white transition-colors">
                  DBMS Concurrency Lab
                </Link>
              </li>
              <li>
                <Link href="/auditor/dashboard" className="hover:text-white transition-colors">
                  Auditor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  System Architecture Docs
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
            <span>Relational DBMS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
