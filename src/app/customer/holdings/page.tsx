'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, RefreshCw, Lock, Search, Wallet } from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import DataTable, { Column } from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';

interface HoldingRecord {
  assetId: number;
  symbol: string;
  name: string;
  type: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  simRefPrice: number;
  simulatedValueSru: number;
}

export default function CustomerHoldingsPage() {
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [totalValuation, setTotalValuation] = useState(0);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchHoldings = () => {
    fetch('/api/customer/holdings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.holdings) {
          setHoldings(data.holdings);
          setTotalValuation(data.totalPortfolioValue || 0);
          setAccount(data.account);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const filtered = holdings.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || h.type.toUpperCase() === filterType;
    return matchesSearch && matchesType;
  });

  const columns: Column<HoldingRecord>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (h) => (
        <div>
          <div className="font-bold text-[#1B0B5C] text-sm leading-tight">{h.name}</div>
          <div className="text-xs font-mono font-semibold text-[#0B4FFF] mt-0.5">{h.symbol}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (h) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
            h.type === 'crypto'
              ? 'bg-[#EEF3FF] text-[#0B4FFF] border border-[#D9E4FF]'
              : 'bg-[#F5F0FF] text-[#8B5CF6] border border-[#E9D8FF]'
          }`}
        >
          {h.type}
        </span>
      ),
    },
    {
      key: 'totalQuantity',
      header: 'Total Balance',
      align: 'right',
      render: (h) => (
        <span className="font-mono font-medium text-[#2B2F4A] tabular-nums">
          {h.totalQuantity} <span className="text-xs text-[#6B7090]">{h.symbol}</span>
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available',
      align: 'right',
      render: (h) => (
        <span className="font-mono font-bold text-[#0E9F73] tabular-nums">
          {h.availableQuantity}
        </span>
      ),
    },
    {
      key: 'reservedQuantity',
      header: 'Reserved',
      align: 'right',
      render: (h) =>
        h.reservedQuantity > 0 ? (
          <span className="font-mono font-semibold text-[#D97706] inline-flex items-center gap-1 tabular-nums">
            <Lock className="w-3 h-3" /> {h.reservedQuantity}
          </span>
        ) : (
          <span className="font-mono text-[#6B7090]">0.00</span>
        ),
    },
    {
      key: 'simRefPrice',
      header: 'Unit Price',
      align: 'right',
      render: (h) => (
        <span className="font-mono text-[#6B7090] tabular-nums">
          {h.simRefPrice.toLocaleString()} SRU
        </span>
      ),
    },
    {
      key: 'simulatedValueSru',
      header: 'Total Value',
      align: 'right',
      render: (h) => (
        <span className="font-mono font-bold text-[#1B0B5C] tabular-nums">
          {h.simulatedValueSru.toLocaleString()}{' '}
          <span className="text-xs text-[#0B4FFF] font-normal">SRU</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (h) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/customer/transfer?assetId=${h.assetId}`}
            className="px-3 py-1 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs transition-colors"
          >
            Send
          </Link>
          <Link
            href={`/customer/swap?fromAsset=${h.assetId}`}
            className="px-3 py-1 rounded-full bg-white border border-[#0B4FFF] text-[#0B4FFF] hover:bg-[#EEF3FF] font-semibold text-xs transition-colors"
          >
            Swap
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Multi-Asset Holdings"
        subtitle="Recorded in PostgreSQL"
        accountNo={account?.account_no}
        accountStatus={account?.status}
        badge={
          <div className="px-3 py-1 rounded-full bg-white border border-[#E8ECF6] shadow-xs text-xs font-semibold text-[#1B0B5C]">
            Total Value:{' '}
            <span className="font-mono text-[#0B4FFF] font-bold">
              {totalValuation.toLocaleString()} SRU
            </span>
          </div>
        }
      />

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6B7090] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset or symbol..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)] focus:outline-none text-xs text-[#1B0B5C] placeholder-[#8A90B0] transition-all"
          />
        </div>

        <div className="flex items-center p-1 rounded-full bg-[#EEF1FA] border border-[#E8ECF6] w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-[#0B4FFF] text-white shadow-xs'
                : 'text-[#6B7090] hover:text-[#1B0B5C]'
            }`}
          >
            All Assets ({holdings.length})
          </button>
          <button
            onClick={() => setFilterType('CRYPTO')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'CRYPTO'
                ? 'bg-[#0B4FFF] text-white shadow-xs'
                : 'text-[#6B7090] hover:text-[#1B0B5C]'
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setFilterType('STOCK')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterType === 'STOCK'
                ? 'bg-[#0B4FFF] text-white shadow-xs'
                : 'text-[#6B7090] hover:text-[#1B0B5C]'
            }`}
          >
            Equities (Simulated)
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(h) => h.symbol}
        loading={loading}
        emptyMessage="No asset holdings match your filter criteria."
      />
    </AppShell>
  );
}
