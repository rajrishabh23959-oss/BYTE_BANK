'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ShieldAlert,
  Users,
  Wallet,
  Activity,
  Layers,
  CheckCircle2,
  ArrowRight,
  Scale,
  Sliders,
  FlaskConical,
  Search,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';

const NetworkGraphCanvas = dynamic(() => import('../../../components/canvas/NetworkGraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center text-[#6B7090] text-xs font-mono bg-[#F6F8FF] rounded-2xl border border-[#E8ECF6]">
      Initializing 3D Transaction Network Graph...
    </div>
  ),
});

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [reportsRes, reconRes, kycRes] = await Promise.all([
        fetch('/api/auditor/reports').then((r) => r.json()),
        fetch('/api/admin/reconciliation').then((r) => r.json()),
        fetch('/api/admin/kyc?status=pending').then((r) => r.json()),
      ]);

      if (reportsRes) setStats(reportsRes);
      if (reconRes?.summary) setReconciliation(reconRes.summary);
      if (kycRes?.customers) setPendingKycCount(kycRes.customers.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('TRANSACTION_UPDATE', () => fetchDashboardData());
    sse.addEventListener('KYC_UPDATE', () => fetchDashboardData());
    sse.addEventListener('PRICE_UPDATE', () => fetchDashboardData());
    return () => sse.close();
  }, []);

  const totals = stats?.totals || {};

  return (
    <AppShell>
      <PageHeader
        title="Administrative Control Center"
        subtitle="Real-time telemetry, transaction network graph, compliance reviews, and database orchestration."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/lab"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-bold transition-all shadow-xs h-11"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Open DBMS Lab</span>
            </Link>
            <Link
              href="/admin/reconciliation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#0B4FFF] text-[#0B4FFF] text-xs font-bold transition-all shadow-xs h-11"
            >
              <Scale className="w-4 h-4" />
              <span>Run Reconciliation</span>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#0B4FFF] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#0B4FFF]" /> Total Customers
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.customer_count || '125'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Seeded CUST101-225</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#1FD6A0] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#0E9F73]" /> Accounts
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.account_count || '125'}
          </div>
          <div className="text-[11px] text-[#6B7090]">1:1 Customer mapping</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#FFAB2E] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FFAB2E]" /> Pending KYC
          </div>
          <div className="text-2xl font-bold font-mono text-[#D97706] tabular-nums">
            {pendingKycCount}
          </div>
          <Link href="/admin/kyc" className="text-[11px] font-semibold text-[#0B4FFF] hover:underline">
            Review queue &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#8B5CF6] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" /> Total Txns
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.total_transactions || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">
            {totals.total_ledger_entries || '0'} Ledger rows
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#1FD6A0] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#0E9F73]" /> Reconciliation
          </div>
          <div className="text-xl font-bold font-mono text-[#0E9F73] flex items-center gap-1 tabular-nums">
            <CheckCircle2 className="w-4 h-4 text-[#0E9F73]" />
            {reconciliation?.mismatched_pairs === '0' || !reconciliation?.mismatched_pairs
              ? 'Balanced'
              : `${reconciliation?.mismatched_pairs} Drift`}
          </div>
          <div className="text-[11px] text-[#6B7090]">
            {reconciliation?.matched_pairs || '868'} pairs checked
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#F43F6E] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#F43F6E]" /> Audit Triggers
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.total_audit_logs || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Automated change capture</div>
        </div>
      </div>

      <SectionCard
        title="Live Transaction Flow Network (3D Topology)"
        subtitle="Force-directed 3D visualization of account nodes, Treasury liquidity distribution, and active transfer edges."
        action={
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#FFAB2E] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFAB2E] inline-block shadow-xs" /> System Treasury
            </span>
            <span className="flex items-center gap-1.5 text-[#0E9F73] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1FD6A0] inline-block shadow-xs" /> Verified Customers
            </span>
            <span className="flex items-center gap-1.5 text-[#D6204F] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F6E] inline-block shadow-xs" /> Frozen / Flagged
            </span>
          </div>
        }
      >
        <div className="h-96 w-full rounded-2xl overflow-hidden relative">
          <NetworkGraphCanvas />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/kyc"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] border border-[#B9C6FF] text-[#0B4FFF] flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>KYC Review Queue</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Inspect pending customer onboarding, verify SHA-256 ID proof hashes, approve or reject with audit triggers.
          </p>
        </Link>

        <Link
          href="/admin/accounts"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Account Management</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Freeze and unfreeze accounts with mandatory reason codes, view ledger balances, and enforce compliance holds.
          </p>
        </Link>

        <Link
          href="/admin/assets"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E6FBF4] border border-[#99F6E4] text-[#0E9F73] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Assets &amp; Prices</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Configure precision scales, define new crypto/stock pairs, and adjust simulated reference exchange rates with live SSE broadcast.
          </p>
        </Link>

        <Link
          href="/admin/customer-lookup"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Controlled Staff Lookup</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Secure customer data viewer enforcing mandatory purpose codes, automatically recording access logs.
          </p>
        </Link>
      </div>
    </AppShell>
  );
}
