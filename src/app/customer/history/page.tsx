'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Filter,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import SectionCard from '@/components/app/SectionCard';
import DataTable, { Column } from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';

function formatDate(isoStr: string) {
  try {
    const d = new Date(isoStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return isoStr;
  }
}

export default function CustomerHistoryPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'statement'>('transactions');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statement, setStatement] = useState<any[]>([]);
  const [accountNo, setAccountNo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [assetId, setAssetId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [assets, setAssets] = useState<any[]>([]);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/admin/assets');
      const data = await res.json();
      if (data.assets) setAssets(data.assets);
    } catch {}
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (assetId) params.set('assetId', assetId);
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/customer/transactions?${params.toString()}`);
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

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/customer/statement?${params.toString()}`);
      const data = await res.json();
      if (data.entries) {
        setStatement(data.entries);
        setAccountNo(data.accountNo || '');
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
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else {
      fetchStatement();
    }
  }, [page, activeTab, assetId, type, status, startDate, endDate]);

  useEffect(() => {
    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('TRANSACTION_UPDATE', () => {
      if (activeTab === 'transactions') fetchTransactions();
      else fetchStatement();
    });
    return () => sse.close();
  }, [activeTab]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (assetId) params.set('assetId', assetId);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('format', 'csv');
    window.open(`/api/customer/transactions?${params.toString()}`, '_blank');
  };

  const resetFilters = () => {
    setAssetId('');
    setType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const txnColumns: Column[] = [
    {
      key: 'transaction_id',
      header: 'TX ID',
      render: (tx) => (
        <span className="font-mono font-bold text-[#0B4FFF]">
          #{tx.transaction_id}
        </span>
      ),
    },
    {
      key: 'counterparty',
      header: 'Direction / Counterparty',
      render: (tx) => {
        const isDebit = tx.direction === 'OUT' || tx.direction === 'DEBIT';
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isDebit ? 'bg-[#FFE9EF] text-[#D6204F]' : 'bg-[#E6FBF4] text-[#0E9F73]'
              }`}
            >
              {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-[#1B0B5C]">
                {isDebit ? 'To: ' : 'From: '}
                <span className="font-mono text-xs">{tx.counterparty_account_no}</span>
              </div>
              <div className="text-[11px] text-[#6B7090]">{tx.counterparty_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'asset',
      header: 'Asset',
      render: (tx) => (
        <div>
          <span className="font-bold text-[#1B0B5C]">{tx.symbol}</span>{' '}
          <span className="text-[11px] text-[#6B7090]">({tx.asset_name})</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Amount',
      align: 'right',
      render: (tx) => {
        const isDebit = tx.direction === 'OUT' || tx.direction === 'DEBIT';
        return (
          <span
            className={`font-mono font-bold tabular-nums text-xs ${
              isDebit ? 'text-[#D6204F]' : 'text-[#0E9F73]'
            }`}
          >
            {isDebit ? '-' : '+'}
            {parseFloat(tx.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
          </span>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (tx) => (
        <span className="capitalize font-semibold text-xs text-[#2B2F4A]">
          {tx.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (tx) => <StatusChip status={tx.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      align: 'right',
      render: (tx) => (
        <span className="text-xs text-[#6B7090] font-mono tabular-nums">
          {formatDate(tx.created_at)}
        </span>
      ),
    },
  ];

  const statementColumns: Column[] = [
    {
      key: 'entry_id',
      header: 'Entry ID',
      render: (s) => <span className="font-mono font-bold text-[#0B4FFF]">#{s.entry_id}</span>,
    },
    {
      key: 'transaction_id',
      header: 'Tx Ref',
      render: (s) => <span className="font-mono text-xs text-[#6B7090]">#{s.transaction_id}</span>,
    },
    {
      key: 'entry_type',
      header: 'Entry Type',
      render: (s) => <StatusChip status={s.entry_type} size="sm" />,
    },
    {
      key: 'asset',
      header: 'Asset',
      render: (s) => (
        <span className="font-bold text-[#1B0B5C]">
          {s.symbol} <span className="text-xs text-[#6B7090]">({s.asset_name})</span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (s) => {
        const isDebit = s.entry_type === 'DEBIT';
        return (
          <span
            className={`font-mono font-bold tabular-nums ${
              isDebit ? 'text-[#D6204F]' : 'text-[#0E9F73]'
            }`}
          >
            {isDebit ? '-' : '+'}
            {parseFloat(s.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
          </span>
        );
      },
    },
    {
      key: 'resulting_balance',
      header: 'Resulting Balance',
      align: 'right',
      render: (s) => (
        <span className="font-mono font-bold text-[#1B0B5C] tabular-nums">
          {parseFloat(s.resulting_balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Posted At',
      align: 'right',
      render: (s) => (
        <span className="text-xs text-[#6B7090] font-mono tabular-nums">
          {formatDate(s.created_at)}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Activity &amp; Statements"
        subtitle="Browse all historical transfers, simulated swaps, and signed double-entry ledger records"
        accountNo={accountNo || undefined}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-1 rounded-full bg-[#EEF1FA] border border-[#E8ECF6] flex items-center">
              <button
                onClick={() => {
                  setActiveTab('transactions');
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-[#0B4FFF] text-white shadow-xs'
                    : 'text-[#6B7090] hover:text-[#1B0B5C]'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => {
                  setActiveTab('statement');
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'statement'
                    ? 'bg-[#0B4FFF] text-white shadow-xs'
                    : 'text-[#6B7090] hover:text-[#1B0B5C]'
                }`}
              >
                Audit Statement
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="h-10 px-4 rounded-full bg-white border border-[#D5DBEE] hover:bg-[#F6F8FF] text-[#2B2F4A] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#0B4FFF]" />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)] flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#6B7090] font-semibold">
          <Filter className="w-3.5 h-3.5 text-[#0B4FFF]" />
          <span>Filters:</span>
        </div>

        {activeTab === 'transactions' && (
          <>
            <select
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                setPage(1);
              }}
              className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-xs font-semibold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
            >
              <option value="">All Assets</option>
              {assets.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.symbol} ({a.name})
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-xs font-semibold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
            >
              <option value="">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="allocation">Allocation</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2 text-xs font-semibold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>
          </>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[#6B7090] font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-2.5 py-1.5 text-xs text-[#1B0B5C] font-mono focus:outline-none focus:border-[#0B4FFF]"
          />
          <span className="text-[#6B7090] font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-2.5 py-1.5 text-xs text-[#1B0B5C] font-mono focus:outline-none focus:border-[#0B4FFF]"
          />
        </div>

        {(assetId || type || status || startDate || endDate) && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-[#0B4FFF] hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="space-y-4">
        {activeTab === 'transactions' ? (
          <>
            <DataTable
              columns={txnColumns}
              data={transactions}
              keyExtractor={(tx) => tx.transaction_id}
              loading={loading}
              emptyMessage="No transactions match the selected filters."
            />

            <div className="p-4 bg-white rounded-2xl border border-[#E8ECF6] shadow-xs flex items-center justify-between text-xs text-[#6B7090]">
              <span>
                Showing page {page} of {totalPages} ({total} total transactions)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#D5DBEE] hover:bg-[#F6F8FF] disabled:opacity-40 text-[#2B2F4A] font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#D5DBEE] hover:bg-[#F6F8FF] disabled:opacity-40 text-[#2B2F4A] font-semibold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <DataTable
            columns={statementColumns}
            data={statement}
            keyExtractor={(s) => s.entry_id}
            loading={loading}
            emptyMessage="No statement entries found for the selected range."
          />
        )}
      </div>
    </AppShell>
  );
}
