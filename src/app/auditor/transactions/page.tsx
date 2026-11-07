'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Filter,
  RefreshCw,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import StatusChip from '../../../components/app/StatusChip';

export default function AuditorTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [assetId, setAssetId] = useState('');
  const [status, setStatus] = useState('');
  const [assets, setAssets] = useState<any[]>([]);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/admin/assets');
      const data = await res.json();
      if (data.assets) setAssets(data.assets);
    } catch (e) {}
  };

  const fetchMaskedTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (assetId) params.set('assetId', assetId);
      if (status) params.set('status', status);

      const res = await fetch(`/api/auditor/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchMaskedTransactions();
  }, [page, assetId, status]);

  return (
    <AppShell>
      <PageHeader
        title="Masked Transaction Explorer"
        subtitle="Zero-PII compliance view. Customer identifiers are masked; only transaction quantities, asset types, and execution outcomes are accessible."
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
          value={assetId}
          onChange={(e) => {
            setAssetId(e.target.value);
            setPage(1);
          }}
          className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
        >
          <option value="">All Assets</option>
          {assets.map((a) => (
            <option key={a.asset_id} value={a.asset_id}>
              {a.symbol} ({a.name})
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchMaskedTransactions}
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
            Querying PostgreSQL Masked View v_auditor_transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            No masked transactions found for selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Tx ID</th>
                  <th className="py-3.5 px-4">Masked Sender</th>
                  <th className="py-3.5 px-4">Masked Receiver</th>
                  <th className="py-3.5 px-4">Asset</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Outcome Status</th>
                  <th className="py-3.5 px-4 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-[#F6F8FF] transition-colors h-14">
                    <td className="py-3 px-4 text-[#0B4FFF] font-bold">
                      TXN-{tx.transaction_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#2B2F4A]">
                        <EyeOff className="w-3.5 h-3.5 text-[#6B7090]" />
                        <span>{tx.sender_account_no}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#2B2F4A]">
                        <EyeOff className="w-3.5 h-3.5 text-[#6B7090]" />
                        <span>{tx.receiver_account_no}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#1B0B5C]">{tx.symbol}</span>{' '}
                      <span className="text-[10px] text-[#6B7090]">({tx.asset_name})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1B0B5C] tabular-nums">
                      {parseFloat(tx.quantity).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#EEF1FA] text-[#1B0B5C] uppercase text-[10px] font-bold">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={tx.status} />
                      {tx.failure_reason && (
                        <div className="text-[10px] text-[#D6204F] mt-1 max-w-xs truncate font-medium">
                          {tx.failure_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[#6B7090] text-[11px]">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-[#F6F8FF] border-t border-[#E8ECF6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[#6B7090]">
            Page {page} of {totalPages} ({total} masked transactions)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8ECF6] disabled:opacity-40 text-[#2B2F4A] hover:bg-[#EEF1FA] transition-colors flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8ECF6] disabled:opacity-40 text-[#2B2F4A] hover:bg-[#EEF1FA] transition-colors flex items-center gap-1 font-semibold"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
