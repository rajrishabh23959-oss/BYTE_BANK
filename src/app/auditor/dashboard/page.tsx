'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ShieldCheck,
  Eye,
  FileText,
  Activity,
  Layers,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';

const NetworkGraphCanvas = dynamic(() => import('../../../components/canvas/NetworkGraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center text-[#6B7090] text-xs font-mono bg-[#F6F8FF] rounded-2xl border border-[#E8ECF6]">
      Loading 3D Auditor Network Topology...
    </div>
  ),
});

export default function AuditorDashboardPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAuditorData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auditor/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorData();
  }, []);

  const totals = reports?.totals || {};

  return (
    <AppShell>
      <PageHeader
        title="Regulatory & Compliance Portal"
        subtitle="Read-only, privacy-masked oversight of all system transactions, immutable audit trails, and staff access logs."
        actions={
          <Link
            href="/auditor/reports"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-bold transition-all shadow-xs h-11"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics Reports</span>
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#0B4FFF] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0B4FFF]" /> Audited Txns
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.total_transactions || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Via v_auditor_transactions</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#1FD6A0] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0E9F73]" /> Ledger Rows
          </div>
          <div className="text-2xl font-bold font-mono text-[#0E9F73] tabular-nums">
            {totals.total_ledger_entries || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Trigger-guarded immutability</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#8B5CF6] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" /> System Audit Logs
          </div>
          <div className="text-2xl font-bold font-mono text-[#1B0B5C] tabular-nums">
            {totals.total_audit_logs || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Capture of all DB mutations</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#FFAB2E] space-y-1">
          <div className="text-xs font-mono text-[#6B7090] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#D97706]" /> Staff Access Logs
          </div>
          <div className="text-2xl font-bold font-mono text-[#D97706] tabular-nums">
            {totals.total_access_logs || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Purpose-coded read telemetry</div>
        </div>
      </div>

      <SectionCard
        title="Auditor Graph Topology (Masked Identity Nodes)"
        subtitle="Force-directed 3D topology of transaction flows with customer PII stripped at the database level."
        action={
          <span className="text-xs font-mono text-[#0B4FFF] px-3 py-1 rounded-full bg-[#EEF3FF] border border-[#B9C6FF] font-semibold">
            SELECT * FROM v_auditor_transactions
          </span>
        }
      >
        <div className="h-96 w-full rounded-2xl overflow-hidden relative">
          <NetworkGraphCanvas />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/auditor/transactions"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#E6FBF4] border border-[#99F6E4] text-[#0E9F73] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Masked Transactions</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Browse all transfers and swaps without exposing customer names, phone numbers, addresses, or identifiers.
          </p>
        </Link>

        <Link
          href="/auditor/audit-logs"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Immutable Audit Trail</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Inspect trigger-generated audit records capturing table mutations with old and new values.
          </p>
        </Link>

        <Link
          href="/auditor/access-logs"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Staff Access Log</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Audit staff queries against customer PII, verifying purpose codes, timestamps, and request references.
          </p>
        </Link>

        <Link
          href="/auditor/reports"
          className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all group space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] border border-[#B9C6FF] text-[#0B4FFF] flex items-center justify-center group-hover:scale-105 transition-transform">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1B0B5C] flex items-center justify-between">
            <span>Compliance Analytics</span>
            <ArrowRight className="w-4 h-4 text-[#6B7090] group-hover:text-[#0B4FFF] group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[#6B7090] leading-relaxed">
            Interactive charts on failed transaction causes, monthly volumes, and risk screening distributions.
          </p>
        </Link>
      </div>
    </AppShell>
  );
}
