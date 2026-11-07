'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Clock,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import SectionCard from '@/components/app/SectionCard';
import DataTable, { Column } from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';

interface Reservation {
  reservation_id: number;
  asset_id: number;
  symbol: string;
  asset_name: string;
  quantity: string;
  status: 'active' | 'consumed' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  is_live: boolean;
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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [releasingId, setReleasingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRes, holdingsRes] = await Promise.all([
        fetch('/api/customer/reservations').then((r) => r.json()),
        fetch('/api/customer/holdings').then((r) => r.json()),
      ]);

      if (resRes.reservations) {
        setReservations(resRes.reservations);
      }
      if (holdingsRes.holdings) {
        setHoldings(holdingsRes.holdings);
        if (holdingsRes.holdings.length > 0 && !selectedAssetId) {
          setSelectedAssetId(holdingsRes.holdings[0].asset_id);
        }
      }
    } catch {
      setError('Failed to fetch reservations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('TRANSACTION_UPDATE', () => fetchData());
    return () => sse.close();
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const qty = parseFloat(quantity);
    if (!selectedAssetId || !qty || qty <= 0) {
      setError('Please select an asset and valid quantity.');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/customer/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: Number(selectedAssetId),
          quantity: qty,
          durationSeconds: durationMinutes * 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to place reservation.');
        return;
      }

      setSuccessMsg(
        `Successfully locked ${qty} ${data.reservation?.symbol || 'units'} for ${durationMinutes} minutes.`
      );
      setQuantity('');
      fetchData();
    } catch {
      setError('Error communicating with reservation engine.');
    } finally {
      setCreating(false);
    }
  };

  const handleRelease = async (reservationId: number) => {
    try {
      setReleasingId(reservationId);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/customer/reservations?id=${reservationId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to release reservation.');
        return;
      }

      setSuccessMsg(`Reservation RES-${reservationId} successfully released.`);
      fetchData();
    } catch {
      setError('Failed to release reservation lock.');
    } finally {
      setReleasingId(null);
    }
  };

  const columns: Column<Reservation>[] = [
    {
      key: 'reservation_id',
      header: 'Res ID',
      render: (res) => (
        <span className="font-mono font-bold text-[#0B4FFF]">
          RES-{res.reservation_id}
        </span>
      ),
    },
    {
      key: 'asset',
      header: 'Asset',
      render: (res) => (
        <div>
          <span className="font-bold text-[#1B0B5C]">{res.symbol}</span>{' '}
          <span className="text-xs text-[#6B7090]">({res.asset_name})</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Reserved Quantity',
      align: 'right',
      render: (res) => (
        <span className="font-mono font-bold text-[#D97706] tabular-nums">
          {parseFloat(res.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (res) => {
        const isExpired = new Date(res.expires_at) < new Date();
        const effectiveStatus = res.status === 'active' && isExpired ? 'expired' : res.status;
        return <StatusChip status={effectiveStatus} size="sm" />;
      },
    },
    {
      key: 'expires_at',
      header: 'Expires At',
      align: 'right',
      render: (res) => (
        <span className="text-xs text-[#6B7090] font-mono tabular-nums">
          {formatDate(res.expires_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (res) => {
        const isExpired = new Date(res.expires_at) < new Date();
        if (res.status === 'active' && !isExpired) {
          return (
            <button
              onClick={() => handleRelease(res.reservation_id)}
              disabled={releasingId === res.reservation_id}
              className="px-3 py-1 rounded-full bg-[#FFE9EF] hover:bg-[#FDD5DF] border border-[#FED0DC] text-[#D6204F] font-semibold text-xs transition-colors inline-flex items-center gap-1"
            >
              <Unlock className="w-3 h-3" />
              <span>{releasingId === res.reservation_id ? 'Releasing...' : 'Release'}</span>
            </button>
          );
        }
        return <span className="text-xs text-[#8A90B0] font-medium">—</span>;
      },
    },
  ];

  return (
    <AppShell containerClassName="max-w-6xl">
      <PageHeader
        title="Asset Reservations"
        subtitle="Isolate and lock asset balances for in-flight authorizations without race conditions"
        backLink={{ href: '/customer/dashboard', label: 'Back to Dashboard' }}
        actions={
          <button
            onClick={fetchData}
            className="h-10 px-4 rounded-full bg-white border border-[#D5DBEE] hover:bg-[#F6F8FF] text-[#2B2F4A] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0B4FFF]" />
            <span>Refresh</span>
          </button>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-[#FFE9EF] border border-[#FED0DC] text-[#D6204F] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#E6FBF4] border border-[#B2F5DE] text-[#0E9F73] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <SectionCard
            title="Active &amp; Historical Reservations"
            subtitle="Scoped to your account in PostgreSQL"
          >
            <DataTable
              columns={columns}
              data={reservations}
              keyExtractor={(res) => res.reservation_id}
              loading={loading}
              emptyMessage="No active or historical reservations on this account."
            />
          </SectionCard>
        </div>

        <div className="lg:col-span-4">
          <SectionCard
            title="Lock Asset Balance"
            subtitle="Atomic two-phase reservation"
          >
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B2F4A] mb-1.5">
                  Select Asset
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] text-xs font-bold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)]"
                >
                  {holdings.map((h) => (
                    <option key={h.asset_id || h.assetId} value={h.asset_id || h.assetId}>
                      {h.symbol} - Avail: {h.availableQuantity || h.available_qty} {h.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B2F4A] mb-1.5">
                  Quantity to Lock
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)] focus:outline-none text-xs font-mono text-[#1B0B5C] placeholder-[#8A90B0]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2B2F4A] mb-1.5">
                  Lock Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] text-xs font-bold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF]"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] text-[11px] text-[#6B7090] leading-relaxed">
                Reservations are placed using PostgreSQL row-level locks. Locked quantities cannot be spent in simultaneous transfers until released or consumed.
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full h-12 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_-2px_rgba(11,79,255,0.35)] transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{creating ? 'Creating Lock...' : 'Lock Asset Balance'}</span>
              </button>
            </form>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
