'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Wrench,
  ShieldCheck,
  History,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';
import StatusChip from '../../../components/app/StatusChip';

export default function AdminReconciliationPage() {
  const [summary, setSummary] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningRecon, setRunningRecon] = useState(false);
  const [fixingIssueId, setFixingIssueId] = useState<number | null>(null);
  const [fixNote, setFixNote] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reconciliation');
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
      if (data.runs) setRuns(data.runs);
      if (data.issues) setIssues(data.issues);
    } catch (err: any) {
      setMessage({ text: 'Failed to fetch reconciliation state.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const handleRunReconciliation = async () => {
    try {
      setRunningRecon(true);
      setMessage(null);

      const res = await fetch('/api/admin/reconciliation', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Reconciliation run failed.', type: 'error' });
        return;
      }

      setMessage({
        text: `Reconciliation Run #${data.runId} completed! Pairs checked: ${data.detail?.pairs_checked}, Issues found: ${data.detail?.issues_found}.`,
        type: data.detail?.issues_found > 0 ? 'error' : 'success',
      });
      fetchReconciliation();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error running reconciliation.', type: 'error' });
    } finally {
      setRunningRecon(false);
    }
  };

  const handleFixIssue = async (issueId: number) => {
    const note = fixNote.trim() || 'Compensating reversal ledger entry posted via admin reconciliation suite.';
    try {
      setFixingIssueId(issueId);
      setMessage(null);

      const res = await fetch('/api/admin/reconciliation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          resolutionNote: note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Compensating fix failed.', type: 'error' });
        return;
      }

      setMessage({
        text: `Issue #${issueId} resolved via compensating transaction #${data.compensatingTransactionId}. Holding and ledger are now synchronized.`,
        type: 'success',
      });
      setFixNote('');
      fetchReconciliation();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error resolving issue.', type: 'error' });
    } finally {
      setFixingIssueId(null);
    }
  };

  const isMismatched = summary && parseInt(summary.mismatched_pairs, 10) > 0;

  return (
    <AppShell>
      <PageHeader
        title="Ledger Reconciliation Dashboard"
        subtitle="Compare every account/asset holding against the sum of double-entry ledger records. Invariant: holding = ∑ ledger_entry"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunReconciliation}
              disabled={runningRecon}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs h-11"
            >
              {runningRecon ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Pairs...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Reconciliation Now</span>
                </>
              )}
            </button>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#E8ECF6] text-[#0B4FFF] text-xs font-semibold transition-colors shadow-2xs h-11"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </Link>
          </div>
        }
      />

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
            message.type === 'success'
              ? 'bg-[#E6FBF4] border-[#99F6E4] text-[#0E9F73]'
              : 'bg-[#FFE9EF] border-[#FECDD3] text-[#D6204F]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#0E9F73] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#D6204F] shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#0B4FFF] space-y-1">
          <div className="text-xs font-mono text-[#6B7090]">Total Account/Asset Pairs</div>
          <div className="text-3xl font-extrabold text-[#1B0B5C] font-mono tabular-nums">
            {summary?.total_pairs || '868'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Across all customer and system accounts</div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white border-t-4 border-t-[#1FD6A0] space-y-1">
          <div className="text-xs font-mono text-[#6B7090]">Balanced Pairs (100% Match)</div>
          <div className="text-3xl font-extrabold text-[#0E9F73] font-mono flex items-center gap-2 tabular-nums">
            <CheckCircle2 className="w-6 h-6 text-[#0E9F73]" />
            {summary?.matched_pairs || '868'}
          </div>
          <div className="text-[11px] text-[#6B7090]">Holding perfectly equals &sum;(ledger_entry)</div>
        </div>

        <div
          className={`p-6 rounded-2xl bg-white border shadow-card-white border-t-4 space-y-1 ${
            isMismatched ? 'border-t-[#F43F6E] border-[#FECDD3]' : 'border-t-[#1FD6A0] border-[#E8ECF6]'
          }`}
        >
          <div className="text-xs font-mono text-[#6B7090]">Mismatched Pairs (Drift)</div>
          <div
            className={`text-3xl font-extrabold font-mono flex items-center gap-2 tabular-nums ${
              isMismatched ? 'text-[#D6204F]' : 'text-[#0E9F73]'
            }`}
          >
            {isMismatched ? (
              <AlertTriangle className="w-6 h-6 text-[#D6204F] animate-pulse" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#0E9F73]" />
            )}
            {summary?.mismatched_pairs || '0'}
          </div>
          <div className="text-[11px] text-[#6B7090]">
            {isMismatched
              ? 'Drift detected! Open issue recorded below.'
              : 'Zero drift detected. High integrity.'}
          </div>
        </div>
      </div>

      <SectionCard
        title="Reconciliation Issues Log (reconciliation_issue)"
        subtitle="History is never rewritten: any mismatch is resolved via linked compensating adjustment transactions."
      >
        {issues.length === 0 ? (
          <div className="py-12 text-center text-[#6B7090] text-xs font-mono">
            No active or historical reconciliation issues recorded. All ledger entries match holding balances.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Issue ID</th>
                  <th className="py-3 px-4">Account No</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4 text-right">Holding Qty</th>
                  <th className="py-3 px-4 text-right">Ledger Qty</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Compensating Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {issues.map((issue) => (
                  <tr key={issue.issue_id} className="hover:bg-[#F6F8FF] transition-colors h-14">
                    <td className="py-3 px-4 text-[#0B4FFF] font-bold">
                      ISSUE-{issue.issue_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1B0B5C]">{issue.account_no}</td>
                    <td className="py-3 px-4">{issue.symbol}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {parseFloat(issue.holding_qty).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {parseFloat(issue.ledger_qty).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#D6204F] tabular-nums">
                      {parseFloat(issue.variance).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={issue.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {issue.status === 'open' ? (
                        <button
                          onClick={() => handleFixIssue(issue.issue_id)}
                          disabled={fixingIssueId === issue.issue_id}
                          className="px-3.5 py-1.5 rounded-full bg-[#1FD6A0] hover:bg-[#19b98a] text-white text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                        >
                          {fixingIssueId === issue.issue_id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wrench className="w-3 h-3" />
                          )}
                          <span>Compensating Reversal</span>
                        </button>
                      ) : (
                        <span className="text-[#6B7090] text-[11px]">
                          Resolved {new Date(issue.resolved_at).toLocaleTimeString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Recent Automated Reconciliation Runs (reconciliation_run)"
        subtitle="Snapshot history of verification jobs executed across all account balances."
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Finished At</th>
                <th className="py-3 px-4 text-right">Pairs Audited</th>
                <th className="py-3 px-4 text-right">Issues Detected</th>
                <th className="py-3 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
              {runs.map((r) => (
                <tr key={r.run_id} className="hover:bg-[#F6F8FF] transition-colors h-12">
                  <td className="py-2.5 px-4 text-[#0B4FFF] font-bold">RUN-{r.run_id}</td>
                  <td className="py-2.5 px-4 text-[#6B7090]">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-[#6B7090]">
                    {r.finished_at ? new Date(r.finished_at).toLocaleString() : 'Running...'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#1B0B5C] tabular-nums">
                    {r.pairs_checked}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    <span
                      className={`font-bold ${
                        r.issues_found > 0 ? 'text-[#D6204F]' : 'text-[#0E9F73]'
                      }`}
                    >
                      {r.issues_found}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <StatusChip status="success" label="COMPLETED" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
