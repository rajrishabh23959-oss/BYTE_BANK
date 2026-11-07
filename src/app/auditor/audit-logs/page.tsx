'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';

export default function AuditorAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);

      const res = await fetch(`/api/auditor/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, resourceFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Immutable Audit Log Inspector"
        subtitle="All mutating database operations automatically capture before-and-after states with zero-PII masking."
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
          <span>Filters:</span>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
        >
          <option value="">All Actions</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>

        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
        >
          <option value="">All Resources</option>
          <option value="customer">customer</option>
          <option value="account">account</option>
          <option value="asset">asset</option>
          <option value="risk_rule">risk_rule</option>
          <option value="reconciliation_issue">reconciliation_issue</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={fetchAuditLogs}
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
            Querying PostgreSQL Immutable Audit Log...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            No audit log entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4 w-8"></th>
                  <th className="py-3.5 px-4">Log ID</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">Request Ref</th>
                  <th className="py-3.5 px-4 text-right">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.log_id;
                  return (
                    <React.Fragment key={log.log_id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.log_id)}
                        className="hover:bg-[#F6F8FF] cursor-pointer transition-colors h-14"
                      >
                        <td className="py-3 px-4 text-[#6B7090]">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#0B4FFF]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#0B4FFF] font-bold">
                          LOG-{log.log_id}
                        </td>
                        <td className="py-3 px-4 text-[#1B0B5C] font-semibold">
                          {log.actor || 'system'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              log.action === 'INSERT'
                                ? 'bg-[#E6FBF4] text-[#0E9F73] border border-[#99F6E4]'
                                : log.action === 'UPDATE'
                                ? 'bg-[#EEF3FF] text-[#0B4FFF] border border-[#B9C6FF]'
                                : 'bg-[#FFE9EF] text-[#D6204F] border-[#FECDD3]'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1B0B5C]">
                          {log.resource}
                          {log.resource_id && (
                            <span className="text-[#6B7090] text-[10px] ml-1">
                              (#{log.resource_id})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#6B7090] truncate max-w-[160px]">
                          {log.request_ref || 'INTERNAL_TRIGGER'}
                        </td>
                        <td className="py-3 px-4 text-right text-[#6B7090] text-[11px]">
                          {new Date(log.created_at || log.at).toLocaleString()}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#F8FAFF]">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase text-[#D6204F] font-bold">
                                  Previous State (old_value):
                                </span>
                                <pre className="p-3 rounded-xl bg-white border border-[#E8ECF6] text-[11px] text-[#6B7090] overflow-x-auto max-h-48 shadow-2xs font-mono">
                                  {log.old_value
                                    ? JSON.stringify(log.old_value, null, 2)
                                    : 'null (New entity inserted)'}
                                </pre>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase text-[#0E9F73] font-bold">
                                  Mutated State (new_value - Masked):
                                </span>
                                <pre className="p-3 rounded-xl bg-white border border-[#E8ECF6] text-[11px] text-[#0E9F73] overflow-x-auto max-h-48 shadow-2xs font-mono">
                                  {log.new_value
                                    ? JSON.stringify(log.new_value, null, 2)
                                    : 'null (Entity removed)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
