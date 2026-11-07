'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ArrowRightLeft,
  ArrowDown,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import SectionCard from '@/components/app/SectionCard';
import StatusChip from '@/components/app/StatusChip';

interface AssetHolding {
  asset_id: number;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  quantity_scale: number;
  sim_ref_price: string;
  quantity: number;
  available_qty: number;
  reserved_qty: number;
}

export default function SwapPage() {
  const [holdings, setHoldings] = useState<AssetHolding[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [fromAssetId, setFromAssetId] = useState<number | ''>('');
  const [toAssetId, setToAssetId] = useState<number | ''>('');
  const [fromQuantity, setFromQuantity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [holdingsRes, assetsRes] = await Promise.all([
        fetch('/api/customer/holdings').then((r) => r.json()),
        fetch('/api/admin/assets').then((r) => r.json()).catch(() => ({ assets: [] })),
      ]);

      if (holdingsRes.holdings) {
        setHoldings(holdingsRes.holdings);
        if (holdingsRes.holdings.length > 0) {
          setFromAssetId(holdingsRes.holdings[0].asset_id);
        }
      }

      if (assetsRes.assets && assetsRes.assets.length > 0) {
        setAllAssets(assetsRes.assets);
        const other = assetsRes.assets.find((a: any) => a.asset_id !== holdingsRes?.holdings?.[0]?.asset_id);
        if (other) setToAssetId(other.asset_id);
      } else if (holdingsRes.holdings && holdingsRes.holdings.length > 1) {
        setAllAssets(holdingsRes.holdings);
        setToAssetId(holdingsRes.holdings[1].asset_id);
      }
    } catch {
      setError('Failed to load assets and holdings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('PRICE_UPDATE', () => fetchData());
    sse.addEventListener('TRANSACTION_UPDATE', () => fetchData());
    return () => sse.close();
  }, []);

  const selectedFromHolding = holdings.find((h) => h.asset_id === Number(fromAssetId));
  const selectedToAsset = allAssets.find((a) => a.asset_id === Number(toAssetId));

  const handlePercentage = (pct: number) => {
    if (!selectedFromHolding) return;
    const max = selectedFromHolding.available_qty || 0;
    const val = (max * pct).toFixed(Math.min(selectedFromHolding.quantity_scale, 8));
    setFromQuantity(val);
    setPreviewData(null);
    setSwapResult(null);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSwapResult(null);

    const qty = parseFloat(fromQuantity);
    if (!qty || qty <= 0) {
      setError('Please specify a positive amount to swap.');
      return;
    }

    if (fromAssetId === toAssetId) {
      setError('Source and target assets must be different.');
      return;
    }

    try {
      setPreviewLoading(true);
      const res = await fetch('/api/customer/swap/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAssetId: Number(fromAssetId),
          toAssetId: Number(toAssetId),
          fromQuantity: qty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to calculate quote.');
      }

      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with swap quote engine.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!previewData) return;
    try {
      setConfirmLoading(true);
      setError(null);

      const res = await fetch('/api/customer/swap/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAssetId: Number(fromAssetId),
          toAssetId: Number(toAssetId),
          fromQuantity: parseFloat(fromQuantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Swap transaction failed.');
      }

      setSwapResult(data);
      setPreviewData(null);
      setFromQuantity('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Atomic swap transaction was rolled back.');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AppShell containerClassName="max-w-5xl">
      <PageHeader
        title="Simulated Asset Swap"
        subtitle="Atomic zero-sum swap backed by PostgreSQL Market Maker account"
        backLink={{ href: '/customer/dashboard', label: 'Back to Dashboard' }}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <SectionCard
            title="Swap Parameters"
            subtitle="Select assets and amount to exchange"
          >
            <form onSubmit={handlePreview} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-[#FFE9EF] border border-[#FED0DC] text-[#D6204F] text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7090]">
                  <span>You Pay (Debit Source)</span>
                  {selectedFromHolding && (
                    <span>
                      Available:{' '}
                      <button
                        type="button"
                        onClick={() => handlePercentage(1.0)}
                        className="text-[#0B4FFF] hover:underline font-bold"
                      >
                        {selectedFromHolding.available_qty.toFixed(Math.min(selectedFromHolding.quantity_scale, 6))}{' '}
                        {selectedFromHolding.symbol}
                      </button>
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] space-y-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={fromAssetId}
                      onChange={(e) => {
                        setFromAssetId(Number(e.target.value));
                        setPreviewData(null);
                        setSwapResult(null);
                      }}
                      className="bg-white border border-[#E1E6F5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)]"
                    >
                      {holdings.map((h) => (
                        <option key={h.asset_id} value={h.asset_id}>
                          {h.symbol} - {h.name} ({h.type})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={fromQuantity}
                      onChange={(e) => {
                        setFromQuantity(e.target.value);
                        setPreviewData(null);
                        setSwapResult(null);
                      }}
                      className="flex-1 bg-transparent text-right font-mono text-xl font-bold text-[#1B0B5C] placeholder-[#8A90B0] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#E8ECF6]">
                    {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentage(pct)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#E8ECF6] text-[#6B7090] hover:text-[#0B4FFF] text-[11px] font-bold font-mono transition-colors"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    const oldFrom = fromAssetId;
                    setFromAssetId(toAssetId);
                    setToAssetId(oldFrom);
                    setPreviewData(null);
                  }}
                  className="w-9 h-9 rounded-full bg-white border border-[#D9E4FF] hover:border-[#0B4FFF] text-[#0B4FFF] flex items-center justify-center shadow-md hover:scale-105 transition-all"
                  title="Invert swap pair"
                  aria-label="Invert swap pair"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6B7090]">
                  <span>You Receive (Credit Target)</span>
                  {selectedToAsset && (
                    <span>
                      Ref Price: ${parseFloat(selectedToAsset.sim_ref_price).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] flex items-center gap-3">
                  <select
                    value={toAssetId}
                    onChange={(e) => {
                      setToAssetId(Number(e.target.value));
                      setPreviewData(null);
                      setSwapResult(null);
                    }}
                    className="bg-white border border-[#E1E6F5] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)]"
                  >
                    {allAssets.map((a) => (
                      <option key={a.asset_id} value={a.asset_id} disabled={a.asset_id === fromAssetId}>
                        {a.symbol} - {a.name} ({a.type})
                      </option>
                    ))}
                  </select>

                  <div className="flex-1 text-right font-mono text-xl text-[#0E9F73] font-bold">
                    {previewData
                      ? previewData.calculatedToQuantity.toLocaleString(undefined, {
                          maximumFractionDigits: selectedToAsset?.quantity_scale || 6,
                        })
                      : '---'}
                  </div>
                </div>
              </div>

              {!previewData && (
                <button
                  type="submit"
                  disabled={previewLoading || !fromQuantity || parseFloat(fromQuantity) <= 0}
                  className="w-full h-12 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs transition-all shadow-[0_6px_20px_-2px_rgba(11,79,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {previewLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Querying Simulated Reference Rates...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Preview Swap Quote</span>
                    </>
                  )}
                </button>
              )}

              {previewData && (
                <div className="space-y-4 pt-3 border-t border-[#EEF1FA]">
                  <div className="p-4 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                      <span className="text-[#6B7090]">Effective Rate:</span>
                      <span className="font-mono font-bold text-[#1B0B5C]">
                        1 {previewData.fromAsset.symbol} &asymp; {previewData.exchangeRate.toFixed(6)}{' '}
                        {previewData.toAsset.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                      <span className="text-[#6B7090]">From Value:</span>
                      <span className="font-mono text-[#2B2F4A]">
                        {previewData.fromSimulatedSru.toLocaleString()} SRU
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                      <span className="text-[#6B7090]">To Value:</span>
                      <span className="font-mono text-[#2B2F4A]">
                        {previewData.toSimulatedSru.toLocaleString()} SRU
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6B7090]">Market Maker:</span>
                      <span className="font-mono font-bold text-[#0B4FFF]">
                        {previewData.marketMakerAccountNo}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewData(null)}
                      className="flex-1 h-11 rounded-full bg-white border border-[#D5DBEE] text-[#2B2F4A] hover:bg-[#F6F8FF] font-semibold text-xs transition-colors"
                    >
                      Adjust Amount
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteSwap}
                      disabled={confirmLoading}
                      className="flex-1 h-11 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {confirmLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Posting Atomic Swap...</span>
                        </>
                      ) : (
                        <span>Confirm &amp; Swap</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </SectionCard>
        </div>

        <div className="md:col-span-5 space-y-6">
          {swapResult ? (
            <SectionCard
              title="Swap Complete"
              subtitle="Recorded in PostgreSQL ledger"
            >
              <div className="p-4 rounded-xl bg-[#E6FBF4] border border-[#B2F5DE] space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#0E9F73] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Atomic Swap Executed</span>
                </div>
                <p className="text-[#2B2F4A] leading-relaxed">
                  Swap group <code className="text-[#0B4FFF] font-bold">{swapResult.swapGroup}</code> completed with 4 balanced ledger entries.
                </p>

                <div className="p-3 rounded-xl bg-white border border-[#B2F5DE] font-mono text-xs space-y-1 text-[#1B0B5C]">
                  <div>Sold: <span className="font-bold text-[#D6204F]">-{swapResult.soldQuantity} {swapResult.soldSymbol}</span></div>
                  <div>Received: <span className="font-bold text-[#0E9F73]">+{swapResult.receivedQuantity} {swapResult.receivedSymbol}</span></div>
                  <div>Counterparty: {swapResult.marketMakerAccountNo}</div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/customer/history"
                    className="w-full py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View in History
                  </Link>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Market Maker Engine"
              subtitle="Two-legged atomic settlement"
            >
              <div className="space-y-4 text-xs text-[#2B2F4A]">
                <p className="leading-relaxed">
                  ByteBank implements cross-asset swaps through an internal Market Maker account (<code className="font-bold text-[#0B4FFF]">BB-MARKETMAKER</code>).
                </p>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6]">
                    <div className="font-bold text-[#1B0B5C]">Leg 1: Asset Debit</div>
                    <div className="text-[11px] text-[#6B7090] mt-0.5">
                      Customer sends sold asset to Market Maker.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6]">
                    <div className="font-bold text-[#1B0B5C]">Leg 2: Asset Credit</div>
                    <div className="text-[11px] text-[#6B7090] mt-0.5">
                      Market Maker releases acquired asset to Customer.
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B7090] leading-relaxed">
                  Both legs execute within a single PostgreSQL transaction. Zero partial swaps or unbacked states can ever persist.
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
