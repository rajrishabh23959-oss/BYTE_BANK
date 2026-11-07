'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Wallet,
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  History,
  Coins,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import StatCard from '@/components/app/StatCard';
import SectionCard from '@/components/app/SectionCard';
import DataTable, { Column } from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';

const PortfolioOrbCanvas = dynamic(
  () => import('@/components/canvas/PortfolioOrbCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full flex items-center justify-center text-[#6B7090] text-xs font-medium bg-white rounded-2xl border border-[#E8ECF6]">
        Loading 3D Portfolio...
      </div>
    ),
  }
);

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  simRefPrice: number;
  simulatedValueSru: number;
  type: string;
}

interface Transaction {
  transaction_id: number;
  type: string;
  sender_account_no?: string;
  receiver_account_no?: string;
  symbol: string;
  quantity: string | number;
  direction: 'DEBIT' | 'CREDIT';
  status: string;
  created_at: string;
}

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

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    Promise.all([
      fetch('/api/customer/holdings').then((r) => r.json()),
      fetch('/api/customer/transactions?limit=6').then((r) => r.json()),
    ])
      .then(([holdingsData, txnData]) => {
        if (holdingsData?.error?.code === 'UNAUTHORIZED') {
          router.push('/login');
          return;
        }
        setData(holdingsData);
        if (txnData?.transactions) setRecentTxns(txnData.transactions);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();

    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('TRANSACTION_UPDATE', () => fetchDashboard());
    sse.addEventListener('TRANSFER_RECEIVED', () => fetchDashboard());
    return () => sse.close();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 flex flex-col items-center justify-center text-[#6B7090] text-sm font-medium">
          <div className="w-8 h-8 rounded-full border-3 border-[#E8ECF6] border-t-[#0B4FFF] animate-spin mb-3" />
          <span>Querying PostgreSQL Portfolio State...</span>
        </div>
      </AppShell>
    );
  }

  const holdings: Holding[] = data?.holdings || [];
  const account = data?.account;
  const totalValuation = data?.totalPortfolioValue || 0;

  const cryptoHoldings = holdings.filter((h) => h.type === 'crypto');
  const stockHoldings = holdings.filter((h) => h.type === 'stock');

  const cryptoValuation = cryptoHoldings.reduce((sum, h) => sum + (h.simulatedValueSru || 0), 0);
  const stockValuation = stockHoldings.reduce((sum, h) => sum + (h.simulatedValueSru || 0), 0);

  const tableColumns: Column<Transaction>[] = [
    {
      key: 'transaction_id',
      header: 'TX ID',
      render: (txn) => (
        <Link
          href="/customer/history"
          className="font-mono font-semibold text-[#0B4FFF] hover:underline"
        >
          #{txn.transaction_id}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (txn) => (
        <span className="capitalize font-medium text-[#2B2F4A]">
          {txn.type}
        </span>
      ),
    },
    {
      key: 'counterparty',
      header: 'Counterparty',
      render: (txn) => (
        <span className="font-mono text-xs text-[#2B2F4A] flex items-center gap-1">
          {txn.direction === 'DEBIT' ? (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D6204F] shrink-0" />
              <span>To: {txn.receiver_account_no}</span>
            </>
          ) : (
            <>
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#0E9F73] shrink-0" />
              <span>From: {txn.sender_account_no || 'SYSTEM'}</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: 'symbol',
      header: 'Asset',
      render: (txn) => (
        <span className="font-bold text-[#1B0B5C]">
          {txn.symbol}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (txn) => (
        <span
          className={`font-mono font-bold tabular-nums ${
            txn.direction === 'DEBIT' ? 'text-[#D6204F]' : 'text-[#0E9F73]'
          }`}
        >
          {txn.direction === 'DEBIT' ? '-' : '+'}
          {parseFloat(String(txn.quantity))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (txn) => <StatusChip status={txn.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      align: 'right',
      render: (txn) => (
        <span className="text-[#6B7090] text-xs tabular-nums">
          {formatDate(txn.created_at)}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Portfolio Overview"
        accountNo={account?.account_no || 'Loading...'}
        accountStatus={account?.status}
        showDefaultCustomerActions
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Net Portfolio Valuation"
          value={totalValuation.toLocaleString()}
          unit="SRU"
          sublabel="Simulated Reference Units"
          accent="blue"
          icon={<Wallet className="w-4 h-4" />}
        />

        <StatCard
          label="Crypto Allocation"
          value={cryptoValuation.toLocaleString()}
          unit="SRU"
          sublabel={`${totalValuation > 0 ? ((cryptoValuation / totalValuation) * 100).toFixed(1) : 0}% of portfolio`}
          accent="amber"
          icon={<Coins className="w-4 h-4" />}
        />

        <StatCard
          label="Equities / Stocks"
          value={stockValuation.toLocaleString()}
          unit="SRU"
          sublabel={`${totalValuation > 0 ? ((stockValuation / totalValuation) * 100).toFixed(1) : 0}% of portfolio`}
          accent="violet"
          icon={<BarChart3 className="w-4 h-4" />}
        />

        <StatCard
          label="Active Asset Holdings"
          value={holdings.length}
          accent="mint"
          icon={<Layers className="w-4 h-4" />}
          actionLink={{
            href: '/customer/holdings',
            text: 'Inspect multi-asset list →',
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard
            title="Portfolio allocation"
            subtitle="Recorded in PostgreSQL"
          >
            <PortfolioOrbCanvas holdings={holdings} />
          </SectionCard>
        </div>

        <div>
          <SectionCard
            title="Top Asset Positions"
            action={
              <Link
                href="/customer/holdings"
                className="text-xs font-semibold text-[#0B4FFF] hover:text-[#0A3FD1] hover:underline"
              >
                View All ({holdings.length})
              </Link>
            }
          >
            <div className="space-y-3">
              {holdings.slice(0, 5).map((h) => (
                <div
                  key={h.symbol}
                  className="p-3.5 rounded-xl bg-white border border-[#E8ECF6] hover:bg-[#F6F8FF] flex items-center justify-between text-xs transition-colors shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#1B0B5C] flex items-center gap-1.5">
                      <span>{h.name}</span>
                      <span className="font-mono text-[#0B4FFF]">({h.symbol})</span>
                    </div>
                    <div className="text-[11px] text-[#6B7090]">
                      <span className="font-mono text-[#2B2F4A]">{h.availableQuantity}</span> available
                      {h.reservedQuantity > 0 && (
                        <span className="ml-1 text-[#D97706]">({h.reservedQuantity} reserved)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="font-mono font-bold text-[#1B0B5C] tabular-nums">
                      {h.simulatedValueSru.toLocaleString()} SRU
                    </div>
                    <div className="text-[11px] text-[#6B7090] font-mono">
                      @{h.simRefPrice} SRU
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div>
        <SectionCard
          title="Recent transactions"
          subtitle="Recorded in PostgreSQL"
          action={
            <Link
              href="/customer/history"
              className="text-xs font-semibold text-[#0B4FFF] hover:text-[#0A3FD1] hover:underline"
            >
              Full Transaction History →
            </Link>
          }
        >
          <DataTable
            columns={tableColumns}
            data={recentTxns}
            keyExtractor={(txn) => txn.transaction_id}
            emptyMessage="No transactions recorded yet."
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
