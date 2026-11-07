'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  PlusCircle,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';

interface Asset {
  asset_id: number;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  quantity_scale: number;
  sim_ref_price: string;
  price_updated_at: string;
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPriceAsset, setEditingPriceAsset] = useState<Asset | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    name: '',
    type: 'crypto' as 'crypto' | 'stock',
    quantityScale: 8,
    simRefPrice: '',
  });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assets');
      const data = await res.json();
      if (data.assets) setAssets(data.assets);
    } catch (err: any) {
      setMessage({ text: 'Failed to load assets.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();

    const sse = new EventSource('/api/realtime/sse');
    sse.addEventListener('PRICE_UPDATE', () => fetchAssets());
    return () => sse.close();
  }, []);

  const handleUpdatePrice = async () => {
    if (!editingPriceAsset) return;
    const priceVal = parseFloat(newPrice);
    if (!priceVal || priceVal <= 0) {
      setMessage({ text: 'Please enter a positive simulated price.', type: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setMessage(null);

      const res = await fetch('/api/admin/prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: editingPriceAsset.asset_id,
          simRefPrice: priceVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Failed to update price.', type: 'error' });
        return;
      }

      setMessage({
        text: `Price for ${editingPriceAsset.symbol} updated to $${priceVal.toLocaleString()}! Broadcasted live via SSE.`,
        type: 'success',
      });
      setEditingPriceAsset(null);
      setNewPrice('');
      fetchAssets();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating price.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.symbol || !newAsset.name || !newAsset.simRefPrice) {
      setMessage({ text: 'Please complete all required fields.', type: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setMessage(null);

      const res = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newAsset.symbol.toUpperCase().trim(),
          name: newAsset.name.trim(),
          type: newAsset.type,
          quantityScale: Number(newAsset.quantityScale),
          simRefPrice: parseFloat(newAsset.simRefPrice),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Failed to create asset.', type: 'error' });
        return;
      }

      setMessage({
        text: `Asset ${newAsset.symbol.toUpperCase()} added to PostgreSQL registry!`,
        type: 'success',
      });
      setShowAddModal(false);
      setNewAsset({ symbol: '', name: '', type: 'crypto', quantityScale: 8, simRefPrice: '' });
      fetchAssets();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error creating asset.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Asset & Price Management"
        subtitle="Manage asset definitions, configure scale precision rules, and adjust simulated reference exchange rates."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-bold transition-all shadow-xs h-11"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Asset</span>
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
            <AlertCircle className="w-4 h-4 text-[#D6204F] shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[#6B7090] text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0B4FFF] inline mr-2" />
            Querying PostgreSQL Asset Catalog...
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.asset_id}
              className="p-6 rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF] shadow-card-white hover:shadow-card-hover transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#1B0B5C] font-mono">{asset.symbol}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold ${
                        asset.type === 'crypto'
                          ? 'bg-[#EEF3FF] text-[#0B4FFF] border border-[#B9C6FF]'
                          : 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#DDD6FE]'
                      }`}
                    >
                      {asset.type}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B7090] mt-0.5">{asset.name}</div>
                </div>

                <button
                  onClick={() => {
                    setEditingPriceAsset(asset);
                    setNewPrice(parseFloat(asset.sim_ref_price).toString());
                  }}
                  className="p-2 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] hover:bg-[#EEF3FF] text-[#6B7090] hover:text-[#0B4FFF] transition-colors"
                  title="Update Simulated Price"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EEF1FA] text-xs font-mono">
                <div className="flex justify-between items-baseline">
                  <span className="text-[#6B7090]">Simulated Price:</span>
                  <span className="text-xl font-extrabold text-[#1B0B5C] tabular-nums">
                    ${parseFloat(asset.sim_ref_price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-[#6B7090]">
                  <span>Scale Precision:</span>
                  <span className="text-[#0B4FFF] font-bold">{asset.quantity_scale} decimals</span>
                </div>

                <div className="flex justify-between text-[#6B7090] text-[10px]">
                  <span>Last Price Tick:</span>
                  <span>{new Date(asset.price_updated_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingPriceAsset && (
        <div className="fixed inset-0 z-50 bg-[#1B0B5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#1B0B5C] font-bold text-sm">
              <TrendingUp className="w-5 h-5 text-[#0E9F73]" />
              <span>Update Simulated Rate for {editingPriceAsset.symbol}</span>
            </div>

            <p className="text-xs text-[#6B7090] leading-relaxed">
              Entering a new reference rate will update PostgreSQL <code className="text-[#0B4FFF] font-mono">asset.sim_ref_price</code> and broadcast a price tick to all connected clients over Server-Sent Events.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2B2F4A]">
                New Simulated Reference Price (SRU / USD equivalent):
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#6B7090] absolute left-3 top-3" />
                <input
                  type="number"
                  step="any"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl pl-9 pr-3 py-2.5 text-[#1B0B5C] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPriceAsset(null)}
                className="px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF1FA] text-[#2B2F4A] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePrice}
                disabled={processing || !newPrice || parseFloat(newPrice) <= 0}
                className="px-5 py-2 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {processing ? 'Broadcasting...' : 'Broadcast Price Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#1B0B5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAsset}
            className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-2xl max-w-md w-full space-y-4"
          >
            <div className="flex items-center gap-2 text-[#1B0B5C] font-bold text-sm">
              <PlusCircle className="w-5 h-5 text-[#0B4FFF]" />
              <span>Register New Simulated Asset</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#2B2F4A]">Asset Symbol (e.g. SOL, BNB)</label>
                <input
                  type="text"
                  required
                  placeholder="AVAX"
                  value={newAsset.symbol}
                  onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                  className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl px-3 py-2 text-[#1B0B5C] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2B2F4A]">Asset Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Avalanche"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#2B2F4A]">Asset Class</label>
                  <select
                    value={newAsset.type}
                    onChange={(e: any) => setNewAsset({ ...newAsset, type: e.target.value })}
                    className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl px-3 py-2 text-[#1B0B5C] focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Simulated Stock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#2B2F4A]">Quantity Decimals</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={newAsset.quantityScale}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, quantityScale: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl px-3 py-2 text-[#1B0B5C] font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#2B2F4A]">Initial Reference Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="35.50"
                  value={newAsset.simRefPrice}
                  onChange={(e) => setNewAsset({ ...newAsset, simRefPrice: e.target.value })}
                  className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl px-3 py-2 text-[#1B0B5C] font-mono focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF1FA] text-[#2B2F4A] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-5 py-2 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {processing ? 'Registering...' : 'Register in PostgreSQL'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
