import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';
import WaveDivider from '@/components/ui/WaveDivider';

export const metadata = {
  title: 'About ByteBank | DBMS Architecture & Digital Asset Ledger',
  description: 'Learn about the relational database architecture, ACID guarantees, and double-entry invariants behind the ByteBank platform.',
};

export default function AboutPage() {
  return (
    <div className="w-full bg-white text-[#2B2F4A] min-h-screen">
      <section className="relative w-full pt-16 pb-16 bg-[#F3F7FF] text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E8ECF6] text-xs font-semibold text-[#0B4FFF] mb-6 shadow-sm">
            <span>DBMS Architecture &amp; Database Engineering</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
            ABOUT BYTEBANK
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#6B7090] max-w-2xl mx-auto leading-relaxed">
            A production-grade digital asset management and transaction ledger platform engineered directly on PostgreSQL 16.
          </p>
        </div>
        <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
              RELATIONAL DATABASE FOUNDATION
            </h2>
            <p className="text-sm sm:text-base text-[#2B2F4A] leading-relaxed">
              ByteBank stores and tracks digital assets (simulated crypto and equities) and transactions. Built in 3NF and BCNF, every table uses strictly typed PostgreSQL features: NUMERIC(38,18) precision, foreign keys with referential actions, custom ENUM types, and timestamptz audit timestamps.
            </p>
            <p className="text-sm sm:text-base text-[#2B2F4A] leading-relaxed">
              No heavy ORMs obscure the SQL. Triggers enforce append-only immutability on the double-entry ledger, stored procedures coordinate serializable ACID transfers, and database views mask sensitive customer PII for auditor roles.
            </p>
          </div>

          <div className="bg-[#F3F7FF] rounded-2xl p-8 border border-[#E8ECF6] space-y-4 shadow-card-white">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8ECF6] flex items-center justify-center text-[#0B4FFF] shrink-0 shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B0B5C]">PostgreSQL 16 Native Engine</h3>
                <p className="text-xs text-[#6B7090] mt-1 leading-relaxed">
                  Row-level locks (SELECT ... FOR UPDATE) prevent double-spend concurrency anomalies without application-level race windows.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8ECF6] flex items-center justify-center text-[#0B4FFF] shrink-0 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B0B5C]">Strict Double-Entry Ledger</h3>
                <p className="text-xs text-[#6B7090] mt-1 leading-relaxed">
                  Balances are not arbitrary mutable counters. Holding equals SUM(ledger_entry), continuously checked by automated reconciliation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E8ECF6] flex items-center justify-center text-[#0B4FFF] shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B0B5C]">Rule-Based Risk Screening</h3>
                <p className="text-xs text-[#6B7090] mt-1 leading-relaxed">
                  Every transfer assessment evaluates versioned rules, recording immutable audit records for regulatory oversight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F7FF] py-20 relative">
        <WaveDivider fill="#F3F7FF" direction="up" className="absolute top-0 left-0 w-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
              5 NON-NEGOTIABLE DATABASE INVARIANTS
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7090]">
              Guaranteed by PostgreSQL triggers, constraints, and isolation levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E8ECF6] shadow-card-white">
              <div className="text-[#0B4FFF] font-mono text-xs font-bold mb-2">INVARIANT 1</div>
              <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Zero Balance Drift</h3>
              <p className="text-xs text-[#6B7090] leading-relaxed">
                Holding balance is mathematically identical to the sum of all historic ledger entries. Verified continuously by the reconciliation worker.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8ECF6] shadow-card-white">
              <div className="text-[#0B4FFF] font-mono text-xs font-bold mb-2">INVARIANT 2</div>
              <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Append-Only Immutability</h3>
              <p className="text-xs text-[#6B7090] leading-relaxed">
                The trg_ledger_immutable() database trigger raises an exception on any UPDATE or DELETE attempt on ledger rows.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8ECF6] shadow-card-white">
              <div className="text-[#0B4FFF] font-mono text-xs font-bold mb-2">INVARIANT 3</div>
              <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Atomic Reservations</h3>
              <p className="text-xs text-[#6B7090] leading-relaxed">
                Available balance = total &minus; active reservations. Double spend attempts lock rows with SELECT ... FOR UPDATE and fail gracefully.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8ECF6] shadow-card-white">
              <div className="text-[#0B4FFF] font-mono text-xs font-bold mb-2">INVARIANT 4</div>
              <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Idempotent Retry Safety</h3>
              <p className="text-xs text-[#6B7090] leading-relaxed">
                A unique constraint on customer_id + idempotency_key with a SHA-256 fingerprint guarantees exact-once execution semantics.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8ECF6] shadow-card-white">
              <div className="text-[#0B4FFF] font-mono text-xs font-bold mb-2">INVARIANT 5</div>
              <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Privacy-Aware Access Logging</h3>
              <p className="text-xs text-[#6B7090] leading-relaxed">
                Staff reads of customer records write access_log rows with purpose codes. Auditor roles see only masked account numbers and zero PII.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#0B4FFF]/30 bg-blue-50/40 shadow-card-white flex flex-col justify-between">
              <div>
                <div className="text-[#1FD6A0] font-mono text-xs font-bold mb-2">LIVE VERIFICATION</div>
                <h3 className="text-base font-bold text-[#1B0B5C] mb-2">Test Database Invariants</h3>
                <p className="text-xs text-[#6B7090] leading-relaxed">
                  Open the interactive DBMS Concurrency Lab to simulate parallel race conditions against PostgreSQL 16 row locks.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/admin/lab"
                  className="btn-pill-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
                >
                  <span>Launch Concurrency Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
      </section>
    </div>
  );
}
