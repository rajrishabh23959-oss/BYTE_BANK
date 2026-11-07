'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  Filter,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';

export default function AuditorAccessLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purposeFilter, setPurposeFilter] = useState('');

  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (purposeFilter) params.set('purposeCode', purposeFilter);

      const res = await fetch(`/api/auditor/access-logs?${params.toString()}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessLogs();
  }, [purposeFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Staff Access Log Viewer"
        subtitle="Independent regulatory verification of staff queries against customer personally identifiable information (PII)."
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

      <div className="p-4 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#6B7090] font-bold">
          <Filter className="w-3.5 h-3.5 text-[#0B4FFF]" />
          <span>Purpose Filter:</span>
        </div>

        <select
          value={purposeFilter}
          onChange={(e) => setPurposeFilter(e.target.value)}
          className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
        >
          <option value="">All Purpose Codes</option>
          <option value="KYC_VERIFICATION">KYC_VERIFICATION</option>
          <option value="FRAUD_INVESTIGATION">FRAUD_INVESTIGATION</option>
          <option value="CUSTOMER_SUPPORT_INQUIRY">CUSTOMER_SUPPORT_INQUIRY</option>
          <option value="COURT_ORDER_LEGAL">COURT_ORDER_LEGAL</option>
          <option value="AUDIT_COMPLIANCE_REVIEW">AUDIT_COMPLIANCE_REVIEW</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={fetchAccessLogs}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF3FF] border border-[#E8ECF6] text-xs font-mono text-[#0B4FFF] font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0B4FFF] inline mr-2" />
            Querying PostgreSQL Staff Access Log...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            No access log records found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Access ID</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Staff Role</th>
                  <th className="py-3.5 px-4">Data Category</th>
                  <th className="py-3.5 px-4">Purpose Code</th>
                  <th className="py-3.5 px-4">Resource ID</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {logs.map((log) => (
                  <tr key={log.log_id || log.access_id} className="hover:bg-[#F6F8FF] transition-colors h-14">
                    <td className="py-3 px-4 text-[#0B4FFF] font-bold">
                      ACC-{log.log_id || log.access_id}
                    </td>
                    <td className="py-3 px-4 text-[#1B0B5C] font-semibold">
                      {log.staff_name || `Staff #${log.staff_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#EEF1FA] text-[#1B0B5C] text-[10px] font-bold">
                        {log.staff_role || 'ADMIN'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#EEF3FF] text-[#0B4FFF] text-[10px] font-bold">
                        {log.data_category || 'CUSTOMER_PII'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[10px] font-bold">
                        {log.purpose_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7090]">
                      Cust #{log.resource_id}
                    </td>
                    <td className="py-3 px-4 text-right text-[#6B7090] text-[11px]">
                      {new Date(log.accessed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
