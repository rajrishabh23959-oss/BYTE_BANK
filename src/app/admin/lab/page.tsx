'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Zap,
  ShieldAlert,
  RotateCcw,
  Scale,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Lock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';

export default function DbmsLabPage() {
  const [activeTab, setActiveTab] = useState<'concurrency' | 'idempotency' | 'crash' | 'drift'>(
    'concurrency'
  );

  const [concurrencyLoading, setConcurrencyLoading] = useState(false);
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null);

  const [idempotencyLoading, setIdempotencyLoading] = useState(false);
  const [idempotencyResult, setIdempotencyResult] = useState<any | null>(null);

  const [crashLoading, setCrashLoading] = useState(false);
  const [crashResult, setCrashResult] = useState<any | null>(null);

  const [driftLoading, setDriftLoading] = useState(false);
  const [driftResult, setDriftResult] = useState<any | null>(null);

  const runConcurrencyLab = async () => {
    try {
      setConcurrencyLoading(true);
      setConcurrencyResult(null);
      const res = await fetch('/api/lab/concurrency', { method: 'POST' });
      const data = await res.json();
      setConcurrencyResult(data);
    } catch (e: any) {
      setConcurrencyResult({ error: e.message });
    } finally {
      setConcurrencyLoading(false);
    }
  };

  const runIdempotencyLab = async (action: 'exact_retry' | 'conflict_body' | 'concurrent') => {
    try {
      setIdempotencyLoading(true);
      setIdempotencyResult(null);
      const res = await fetch('/api/lab/idempotency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: action }),
      });
      const data = await res.json();
      setIdempotencyResult(data);
    } catch (e: any) {
      setIdempotencyResult({ error: e.message });
    } finally {
      setIdempotencyLoading(false);
    }
  };

  const runCrashLab = async () => {
    try {
      setCrashLoading(true);
      setCrashResult(null);
      const res = await fetch('/api/lab/crash-rollback', { method: 'POST' });
      const data = await res.json();
      setCrashResult(data);
    } catch (e: any) {
      setCrashResult({ error: e.message });
    } finally {
      setCrashLoading(false);
    }
  };

  const runDriftLab = async (step: 'inject' | 'reconcile' | 'fix') => {
    try {
      setDriftLoading(true);
      const res = await fetch('/api/lab/reconciliation-drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: step }),
      });
      const data = await res.json();
      setDriftResult(data);
    } catch (e: any) {
      setDriftResult({ error: e.message });
    } finally {
      setDriftLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Interactive DBMS Lab"
        subtitle="Real-time visual lab for professors, auditors, and engineers to stress-test transaction atomicity, row locks, idempotency keys, and crash rollbacks."
        actions={
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#E8ECF6] text-[#0B4FFF] text-xs font-semibold transition-colors shadow-2xs h-11"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#EEF1FA] border border-[#E8ECF6]">
        <button
          onClick={() => setActiveTab('concurrency')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'concurrency'
              ? 'bg-[#0B4FFF] text-white shadow-xs'
              : 'text-[#6B7090] hover:text-[#1B0B5C]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>1. Concurrency Race</span>
        </button>

        <button
          onClick={() => setActiveTab('idempotency')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'idempotency'
              ? 'bg-[#0B4FFF] text-white shadow-xs'
              : 'text-[#6B7090] hover:text-[#1B0B5C]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>2. Idempotency &amp; Retries</span>
        </button>

        <button
          onClick={() => setActiveTab('crash')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'crash'
              ? 'bg-[#0B4FFF] text-white shadow-xs'
              : 'text-[#6B7090] hover:text-[#1B0B5C]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>3. Crash &amp; Autonomous Log</span>
        </button>

        <button
          onClick={() => setActiveTab('drift')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'drift'
              ? 'bg-[#0B4FFF] text-white shadow-xs'
              : 'text-[#6B7090] hover:text-[#1B0B5C]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>4. Drift &amp; Remediation</span>
        </button>
      </div>

      {activeTab === 'concurrency' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1B0B5C] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#FFAB2E]" />
                  <span>Concurrent Double-Spend Race Condition</span>
                </h2>
                <p className="text-xs text-[#6B7090] mt-1">
                  Initial Balance = <span className="text-[#1B0B5C] font-mono font-bold">1.00000000 BTC</span>. Two simultaneous transfers for <span className="text-[#0B4FFF] font-mono font-bold">0.80000000 BTC</span> are launched on parallel database connections.
                </p>
              </div>

              <button
                onClick={runConcurrencyLab}
                disabled={concurrencyLoading}
                className="px-5 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] disabled:opacity-50 text-white font-bold text-xs font-mono transition-all shadow-xs flex items-center gap-2 h-11 shrink-0"
              >
                {concurrencyLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Firing Connections...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute Concurrent Race</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#EEF3FF] border border-[#B9C6FF] font-mono text-xs text-[#2B2F4A] space-y-1.5">
              <div className="text-[#0B4FFF] font-bold">DBMS Invariant Under Test:</div>
              <p className="text-[#2B2F4A] text-[11px] leading-relaxed">
                PostgreSQL row locks (<code className="text-[#0B4FFF] font-bold">SELECT ... FOR UPDATE</code> ordered by <code className="text-[#0B4FFF] font-bold">account_id, asset_id</code>) serialize the requests. The first transaction locks the holding and debits 0.8 BTC (remaining balance = 0.2 BTC). The second transaction unblocks, revalidates available balance, and cleanly fails with <code className="text-[#D6204F] font-bold">INSUFFICIENT_FUNDS</code>.
              </p>
            </div>
          </div>

          {concurrencyResult && (
            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1FA]">
                <span className="text-xs font-mono text-[#6B7090] font-bold">Race Condition Execution Log</span>
                <span
                  className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                    concurrencyResult.invariantMaintained
                      ? 'bg-[#E6FBF4] text-[#0E9F73] border-[#99F6E4]'
                      : 'bg-[#FFE9EF] text-[#D6204F] border-[#FECDD3]'
                  }`}
                >
                  {concurrencyResult.invariantMaintained
                    ? 'INVARIANT PRESERVED: ZERO DOUBLE SPEND'
                    : 'INVARIANT VIOLATED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#1B0B5C] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#0B4FFF]" />
                      <span>Thread A (0.8 BTC)</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                        concurrencyResult.threadA?.success
                          ? 'bg-[#E6FBF4] text-[#0E9F73] border-[#99F6E4]'
                          : 'bg-[#FFE9EF] text-[#D6204F] border-[#FECDD3]'
                      }`}
                    >
                      {concurrencyResult.threadA?.status || 'FAILED'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-[#6B7090]">
                    <div>Tx ID: #{concurrencyResult.threadA?.transactionId || '---'}</div>
                    <div>Duration: {concurrencyResult.threadA?.durationMs}ms</div>
                    <div className="text-[11px] text-[#2B2F4A]">
                      Message: {concurrencyResult.threadA?.message || concurrencyResult.threadA?.error}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#1B0B5C] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>Thread B (0.8 BTC)</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                        concurrencyResult.threadB?.success
                          ? 'bg-[#E6FBF4] text-[#0E9F73] border-[#99F6E4]'
                          : 'bg-[#FFE9EF] text-[#D6204F] border-[#FECDD3]'
                      }`}
                    >
                      {concurrencyResult.threadB?.status || 'FAILED'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-[#6B7090]">
                    <div>Tx ID: #{concurrencyResult.threadB?.transactionId || '---'}</div>
                    <div>Duration: {concurrencyResult.threadB?.durationMs}ms</div>
                    <div className="text-[11px] text-[#2B2F4A]">
                      Message: {concurrencyResult.threadB?.message || concurrencyResult.threadB?.error}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#EEF3FF] border border-[#B9C6FF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#6B7090]">PostgreSQL Verified Final Balance: </span>
                  <span className="text-[#1B0B5C] font-bold text-sm">
                    {concurrencyResult.finalBalance} BTC
                  </span>
                </div>
                <div className="text-[#0E9F73] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0E9F73]" />
                  <span>Exact Mathematical Invariant (1.0 - 0.8 = 0.20000000 BTC)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'idempotency' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
            <h2 className="text-base font-bold text-[#1B0B5C] flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#0B4FFF]" />
              <span>Idempotency Key &amp; Request Fingerprint Verification</span>
            </h2>
            <p className="text-xs text-[#6B7090]">
              ByteBank scopes idempotency keys per customer with a SHA-256 parameter fingerprint. Test the 3 canonical API outcomes:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => runIdempotencyLab('exact_retry')}
                disabled={idempotencyLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#0B4FFF] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#1B0B5C] group-hover:text-[#0B4FFF] font-mono flex items-center justify-between">
                  <span>Scenario A: Identical Retry</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7090] group-hover:text-[#0B4FFF] transition-colors" />
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Same Key + Same Body &rarr; Returns cached result with <strong>IDEMPOTENT_REPLAY</strong> header without duplicate debits.
                </div>
              </button>

              <button
                onClick={() => runIdempotencyLab('conflict_body')}
                disabled={idempotencyLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#F43F6E] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#1B0B5C] group-hover:text-[#D6204F] font-mono flex items-center justify-between">
                  <span>Scenario B: Payload Conflict</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7090] group-hover:text-[#D6204F] transition-colors" />
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Same Key + Altered Amount &rarr; Returns <strong>409 Conflict</strong> with fingerprint hash mismatch explanation.
                </div>
              </button>

              <button
                onClick={() => runIdempotencyLab('concurrent')}
                disabled={idempotencyLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#FFAB2E] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#1B0B5C] group-hover:text-[#D97706] font-mono flex items-center justify-between">
                  <span>Scenario C: In-Flight Collision</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B7090] group-hover:text-[#D97706] transition-colors" />
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Same Key while request is in progress &rarr; Returns <strong>425 Too Early</strong> or 409 In Progress.
                </div>
              </button>
            </div>
          </div>

          {idempotencyResult && (
            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1FA]">
                <span className="text-[#6B7090] font-bold">Idempotency Protocol Response</span>
                <span className="text-[#0B4FFF] font-bold">{idempotencyResult.scenario}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B7090]">Idempotency Key:</span>
                  <span className="text-[#1B0B5C] font-bold">{idempotencyResult.idempotencyKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7090]">Fingerprint SHA-256:</span>
                  <span className="text-[#0B4FFF] break-all">{idempotencyResult.fingerprint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7090]">HTTP Status:</span>
                  <span
                    className={
                      idempotencyResult.status === 200
                        ? 'text-[#0E9F73] font-bold'
                        : idempotencyResult.status === 409
                        ? 'text-[#D6204F] font-bold'
                        : 'text-[#D97706] font-bold'
                    }
                  >
                    {idempotencyResult.status} {idempotencyResult.statusText}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7090]">Result Message:</span>
                  <span className="text-[#2B2F4A]">{idempotencyResult.message}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'crash' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1B0B5C] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#D6204F]" />
                  <span>Crash Rollback &amp; Autonomous Failure Persistence</span>
                </h2>
                <p className="text-xs text-[#6B7090] mt-1">
                  Trigger an intentional mid-transaction abort (e.g. invalid status transition or constraint violation).
                </p>
              </div>

              <button
                onClick={runCrashLab}
                disabled={crashLoading}
                className="px-5 py-2.5 rounded-full bg-[#F43F6E] hover:bg-[#d6204f] disabled:opacity-50 text-white font-bold text-xs font-mono transition-all shadow-xs flex items-center gap-2 h-11 shrink-0"
              >
                {crashLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Simulating Abort...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Trigger Transaction Crash</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FFE9EF] border border-[#FECDD3] font-mono text-xs text-[#2B2F4A] space-y-1.5">
              <div className="text-[#D6204F] font-bold">The Rollback Paradox:</div>
              <p className="text-[#2B2F4A] text-[11px] leading-relaxed">
                In PostgreSQL, an aborted transaction rolls back <em>all</em> internal modifications (no ledger rows created, balances untouched). However, compliance and audit rules mandate that <strong>failed attempts must be logged</strong>. ByteBank solves this using an autonomous connection runner that logs the failure record and reason outside the aborted transaction.
              </p>
            </div>
          </div>

          {crashResult && (
            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1FA]">
                <span className="text-[#6B7090] font-bold">Autonomous Failure Telemetry</span>
                <span className="text-[#0E9F73] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0E9F73]" />
                  <span>ACID Atomicity &amp; Audit Maintained</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-2">
                  <div className="text-[#D6204F] font-bold">Primary Posting Transaction:</div>
                  <div className="text-[#6B7090]">Status: <span className="text-[#D6204F] font-bold">ROLLED BACK</span></div>
                  <div className="text-[#6B7090]">Balances Changed: <span className="text-[#0E9F73] font-bold">0 (Zero Mutation)</span></div>
                  <div className="text-[#6B7090]">Aborted Error: <span className="text-[#D6204F]">{crashResult.abortedError}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-2">
                  <div className="text-[#0B4FFF] font-bold">Autonomous Logging Path:</div>
                  <div className="text-[#6B7090]">Persisted Tx ID: <span className="text-[#1B0B5C] font-bold">#{crashResult.loggedTransactionId}</span></div>
                  <div className="text-[#6B7090]">Recorded Status: <span className="text-[#D6204F] font-bold">FAILED</span></div>
                  <div className="text-[#6B7090]">Failure Reason: <span className="text-[#2B2F4A]">{crashResult.loggedFailureReason}</span></div>
                  <div className="text-[#6B7090]">Audit Log Row: <span className="text-[#0E9F73] font-bold">Committed to audit_log</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drift' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
            <h2 className="text-base font-bold text-[#1B0B5C] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#0B4FFF]" />
              <span>Reconciliation Drift Injection &amp; Compensating Resolution</span>
            </h2>
            <p className="text-xs text-[#6B7090]">
              Verify how ByteBank detects out-of-band balance anomalies without ever mutating historical ledger records:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => runDriftLab('inject')}
                disabled={driftLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#FFAB2E] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#D97706] font-mono">
                  Step 1: Inject Drift
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Deliberately introduce +5.00 holding variance into an account to simulate database drift.
                </div>
              </button>

              <button
                onClick={() => runDriftLab('reconcile')}
                disabled={driftLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#0B4FFF] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#0B4FFF] font-mono">
                  Step 2: Run Reconciliation
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Execute <code className="text-[#0B4FFF] font-bold">run_reconciliation()</code> to detect drift and create a <code className="text-[#0B4FFF] font-bold">reconciliation_issue</code>.
                </div>
              </button>

              <button
                onClick={() => runDriftLab('fix')}
                disabled={driftLoading}
                className="p-5 rounded-2xl bg-[#F6F8FF] border border-[#E8ECF6] hover:border-[#1FD6A0] hover:bg-white text-left space-y-2 transition-all group shadow-2xs"
              >
                <div className="text-xs font-bold text-[#0E9F73] font-mono">
                  Step 3: Compensating Reversal
                </div>
                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Execute <code className="text-[#0E9F73] font-bold">reconcile_fix_issue()</code> to insert a linked reversal ledger entry without editing history!
                </div>
              </button>
            </div>
          </div>

          {driftResult && (
            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEF1FA]">
                <span className="text-[#6B7090] font-bold">Reconciliation Step Result</span>
                <span className="text-[#0B4FFF] font-bold">{driftResult.action}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-2 text-[#2B2F4A]">
                <div>Message: {driftResult.message}</div>
                {driftResult.variance && <div>Detected Variance: <span className="text-[#D97706] font-bold">{driftResult.variance}</span></div>}
                {driftResult.issueId && <div>Open Issue ID: <span className="text-[#0B4FFF] font-bold">ISSUE-{driftResult.issueId}</span></div>}
                {driftResult.reversalEntryId && <div>Compensating Ledger Entry: <span className="text-[#0E9F73] font-bold">ENTRY-{driftResult.reversalEntryId}</span></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
