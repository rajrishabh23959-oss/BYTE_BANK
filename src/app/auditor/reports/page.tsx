'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar as ColumnBar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  AlertTriangle,
  Database,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';
import StatusChip from '../../../components/app/StatusChip';

const STATUS_COLORS: Record<string, string> = {
  success: '#1FD6A0',
  pending: '#FFAB2E',
  failed: '#F43F6E',
  rejected: '#8B5CF6',
};

const RISK_COLORS: Record<string, string> = {
  ALLOW: '#1FD6A0',
  REQUIRE_EXTRA_CONFIRMATION: '#FFAB2E',
  REJECT: '#F43F6E',
};

export default function AuditorReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
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
    fetchReports();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center py-24 text-[#6B7090] font-mono text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B4FFF] mr-2" />
          Aggregating Compliance Views from PostgreSQL...
        </div>
      </AppShell>
    );
  }

  const failedByMonth = reports?.failedByMonth || [];
  const statusBreakdown = (reports?.statusBreakdown || []).map((s: any) => ({
    name: s.status.toUpperCase(),
    value: parseInt(s.count, 10),
    percentage: parseFloat(s.percentage).toFixed(1),
    statusKey: s.status,
  }));

  const assetVolumes = (reports?.assetVolumes || []).map((a: any) => ({
    symbol: a.symbol,
    type: a.type,
    volume: parseFloat(a.total_simulated_volume_sru),
    txnCount: parseInt(a.txn_count, 10),
  }));

  const riskStats = (reports?.riskStats || []).map((r: any) => ({
    name: r.outcome,
    value: parseInt(r.count, 10),
  }));

  return (
    <AppShell>
      <PageHeader
        title="Regulatory Reports & Trends"
        subtitle="Visual telemetry on transaction success rates, risk rule distributions, and failed transaction cause clustering."
        actions={
          <Link
            href="/auditor/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#E8ECF6] text-[#0B4FFF] text-xs font-semibold transition-colors shadow-2xs h-11"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Auditor Dashboard</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard
          title="Transaction Outcome Distribution"
          subtitle="PostgreSQL status enum breakdown across all historical transactions."
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.statusKey] || '#6B7090'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8ECF6',
                    borderRadius: '0.75rem',
                    boxShadow: '0 8px 30px rgba(27,11,92,0.08)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#1B0B5C',
                  }}
                />
                <Legend
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-mono text-[#2B2F4A]">
                      {val} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Risk Screening Outcomes"
          subtitle="Automated risk rules engine decisions via assess_transfer_risk()."
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskStats}>
                <XAxis dataKey="name" stroke="#6B7090" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#6B7090" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8ECF6',
                    borderRadius: '0.75rem',
                    boxShadow: '0 8px 30px rgba(27,11,92,0.08)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#1B0B5C',
                  }}
                />
                <ColumnBar dataKey="value" fill="#0B4FFF" radius={[6, 6, 0, 0]}>
                  {riskStats.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={RISK_COLORS[entry.name] || '#0B4FFF'}
                    />
                  ))}
                </ColumnBar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Simulated Reference Volume by Asset (SRU / USD Equivalent)"
        subtitle="Computed as quantity × sim_ref_price across all settled transactions."
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assetVolumes}>
              <XAxis dataKey="symbol" stroke="#6B7090" fontSize={12} fontFamily="monospace" />
              <YAxis stroke="#6B7090" fontSize={11} fontFamily="monospace" />
              <Tooltip
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Simulated Volume']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8ECF6',
                  borderRadius: '0.75rem',
                  boxShadow: '0 8px 30px rgba(27,11,92,0.08)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#1B0B5C',
                }}
              />
              <ColumnBar dataKey="volume" fill="#0B4FFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="Failed & Rejected Transactions by Month (v_failed_by_month)"
        subtitle="Materialized aggregation of transaction rejections, grouped by calendar month and failure reason codes."
      >
        {failedByMonth.length === 0 ? (
          <div className="py-12 text-center text-[#6B7090] text-xs font-mono">
            No failed transactions recorded in monthly aggregate view.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4 font-semibold">Calendar Month</th>
                  <th className="py-3 px-4 font-semibold">Outcome Status</th>
                  <th className="py-3 px-4 font-semibold">Failure Reason / Violation</th>
                  <th className="py-3 px-4 font-semibold text-right">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {failedByMonth.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[#F6F8FF] transition-colors h-12">
                    <td className="py-2.5 px-4 font-bold text-[#1B0B5C]">
                      {new Date(row.month).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusChip status={row.status} />
                    </td>
                    <td className="py-2.5 px-4 text-[#6B7090]">
                      {row.failure_reason || 'Unknown constraint failure'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-[#1B0B5C] tabular-nums">
                      {row.n}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
