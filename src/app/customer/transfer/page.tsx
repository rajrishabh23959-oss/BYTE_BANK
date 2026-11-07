'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Coins,
} from 'lucide-react';
import AppShell from '@/components/app/AppShell';
import PageHeader from '@/components/app/PageHeader';
import SectionCard from '@/components/app/SectionCard';
import StatusChip from '@/components/app/StatusChip';

const TransferCoinCanvas = dynamic(() => import('@/components/canvas/TransferCoinCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full flex items-center justify-center text-[#6B7090] text-xs font-medium bg-white rounded-2xl border border-[#E8ECF6]">
      Loading 3D Transfer Node...
    </div>
  ),
});

function TransferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAssetId = searchParams.get('assetId');

  const [holdings, setHoldings] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);

  const [recipientAccountNo, setRecipientAccountNo] = useState('BB-ACC-5003');
  const [assetId, setAssetId] = useState<number>(1);
  const [quantity, setQuantity] = useState<string>('0.1');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmReceipt, setConfirmReceipt] = useState<any>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  useEffect(() => {
    fetch('/api/customer/holdings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.holdings) {
          setHoldings(d.holdings);
          setAccount(d.account);
          if (preselectedAssetId) {
            setAssetId(parseInt(preselectedAssetId, 10));
          } else if (d.holdings.length > 0) {
            setAssetId(d.holdings[0].assetId);
          }
        }
      });
  }, [preselectedAssetId]);

  const selectedHolding = holdings.find((h) => h.assetId === assetId);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);
    setConfirmReceipt(null);
    setTransferStatus('idle');

    try {
      const res = await fetch('/api/customer/transfer/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAccountNo,
          assetId,
          quantity: parseFloat(quantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error?.message || 'Transfer preview failed.');
        return;
      }

      setPreviewData(data.preview);
    } catch {
      setPreviewError('Failed to connect to safety preview engine.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setConfirmLoading(true);
    setConfirmError(null);
    setTransferStatus('pending');

    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const res = await fetch('/api/customer/transfer/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          recipientAccountNo,
          assetId,
          quantity: parseFloat(quantity),
          authToken: previewData.authToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferStatus('failed');
        setConfirmError(data.error?.message || 'Transfer failed and rolled back.');
        return;
      }

      setTransferStatus('success');
      setConfirmReceipt(data);
    } catch (err: any) {
      setTransferStatus('failed');
      setConfirmError(err.message || 'Transaction failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <AppShell containerClassName="max-w-5xl">
      <PageHeader
        title="Execute Asset Transfer"
        subtitle="Recorded in PostgreSQL with double-entry ledger"
        accountNo={account?.account_no}
        accountStatus={account?.status}
      />

      <TransferCoinCanvas
        status={transferStatus}
        senderAccountNo={account?.account_no || 'BB-ACC-5001'}
        receiverAccountNo={recipientAccountNo}
        assetSymbol={selectedHolding?.symbol || 'ASSET'}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <SectionCard
          title="1. Transfer Parameters"
          subtitle="Configure recipient, asset, and quantity"
        >
          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#2B2F4A] mb-1.5">
                Recipient Account Number
              </label>
              <input
                type="text"
                required
                value={recipientAccountNo}
                onChange={(e) => setRecipientAccountNo(e.target.value.toUpperCase())}
                placeholder="BB-ACC-5003"
                className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)] focus:outline-none text-xs font-mono text-[#1B0B5C] placeholder-[#8A90B0] transition-all"
              />
              <span className="text-[11px] text-[#6B7090] mt-1.5 block">
                Sample accounts: BB-ACC-5001 (Rishi), BB-ACC-5002 (Rahul), BB-ACC-5003 (Priya), BB-ACC-5004 (Frozen)
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#2B2F4A] mb-1.5">
                Select Asset to Send
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(parseInt(e.target.value, 10))}
                className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] text-xs font-semibold text-[#1B0B5C] focus:outline-none focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)] transition-all"
              >
                {holdings.map((h) => (
                  <option key={h.assetId} value={h.assetId}>
                    {h.name} ({h.symbol}) — Avail: {h.availableQuantity} {h.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-[#2B2F4A]">
                  Transfer Quantity
                </label>
                {selectedHolding && (
                  <button
                    type="button"
                    onClick={() => setQuantity(String(selectedHolding.availableQuantity))}
                    className="text-xs font-mono font-semibold text-[#0B4FFF] hover:text-[#0A3FD1] hover:underline"
                  >
                    Max ({selectedHolding.availableQuantity})
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="0.00000001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.1"
                className="w-full h-12 px-3.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] focus:ring-3 focus:ring-[rgba(11,79,255,0.18)] focus:outline-none text-xs font-mono text-[#1B0B5C] transition-all"
              />
            </div>

            {previewError && (
              <div className="p-3.5 rounded-xl bg-[#FFE9EF] border border-[#FED0DC] text-[#D6204F] text-xs font-semibold">
                {previewError}
              </div>
            )}

            <button
              type="submit"
              disabled={previewLoading || !selectedHolding}
              className="w-full h-12 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_-2px_rgba(11,79,255,0.35)] transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{previewLoading ? 'Screening Risk Rules...' : 'Run Transaction Safety Preview'}</span>
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="2. Safety Preview &amp; Confirmation"
          subtitle="Pre-flight rule check before PostgreSQL commit"
        >
          {!previewData && !confirmReceipt && (
            <div className="py-20 text-center text-[#6B7090] text-xs flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-[#EEF3FF] flex items-center justify-center text-[#0B4FFF]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="max-w-xs font-medium">
                Enter transfer details and run Safety Preview to inspect recipient and risk reasons.
              </span>
            </div>
          )}

          {previewData && !confirmReceipt && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  previewData.outcome === 'ALLOW'
                    ? 'bg-[#E6FBF4] border-[#B2F5DE] text-[#0E9F73]'
                    : previewData.outcome === 'REQUIRE_EXTRA_CONFIRMATION'
                    ? 'bg-[#FFF4DD] border-[#FDE6B0] text-[#B7791F]'
                    : 'bg-[#FFE9EF] border-[#FED0DC] text-[#D6204F]'
                }`}
              >
                {previewData.outcome === 'ALLOW' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#0E9F73] shrink-0" />
                ) : previewData.outcome === 'REQUIRE_EXTRA_CONFIRMATION' ? (
                  <AlertTriangle className="w-5 h-5 text-[#B7791F] shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#D6204F] shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wide">
                    OUTCOME: {previewData.outcome.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed font-medium">
                    {previewData.outcome === 'ALLOW' && 'Transfer cleared deterministic risk screening parameters.'}
                    {previewData.outcome === 'REQUIRE_EXTRA_CONFIRMATION' && 'Secondary confirmation required before posting.'}
                    {previewData.outcome === 'REJECT' && 'Transfer blocked by database compliance rules.'}
                  </div>
                </div>
              </div>

              {previewData.reasons?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] space-y-1.5">
                  <span className="font-bold text-[#1B0B5C] text-xs block">Screening Rule Reasons:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[#2B2F4A] text-xs">
                    {previewData.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 p-3.5 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] text-xs">
                <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                  <span className="text-[#6B7090]">Recipient (Masked):</span>
                  <span className="font-semibold text-[#1B0B5C]">
                    {previewData.recipient.ownerMasked} ({previewData.recipient.accountNo})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                  <span className="text-[#6B7090]">Transfer Amount:</span>
                  <span className="font-mono font-bold text-[#0B4FFF]">
                    {previewData.transferQuantity} {previewData.asset.symbol} (~{previewData.simulatedValueSru} SRU)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8ECF6]">
                  <span className="text-[#6B7090]">Current Available:</span>
                  <span className="font-mono text-[#2B2F4A]">
                    {previewData.currentAvailableQuantity} {previewData.asset.symbol}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7090]">Resulting Available Balance:</span>
                  <span className="font-mono font-bold text-[#0E9F73]">
                    {previewData.resultingAvailableQuantity} {previewData.asset.symbol}
                  </span>
                </div>
              </div>

              {confirmError && (
                <div className="p-3.5 rounded-xl bg-[#FFE9EF] border border-[#FED0DC] text-[#D6204F] text-xs font-semibold">
                  {confirmError}
                </div>
              )}

              {previewData.outcome !== 'REJECT' && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmLoading}
                  className="w-full h-12 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_-2px_rgba(11,79,255,0.35)] transition-all disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {confirmLoading
                      ? 'Posting Atomic ACID Transfer...'
                      : previewData.outcome === 'REQUIRE_EXTRA_CONFIRMATION'
                      ? 'Confirm & Authorize Flagged Transfer'
                      : 'Confirm & Commit Transfer'}
                  </span>
                </button>
              )}
            </div>
          )}

          {confirmReceipt && (
            <div className="p-5 rounded-2xl bg-[#E6FBF4] border border-[#B2F5DE] text-xs space-y-4">
              <div className="flex items-center gap-2 text-[#0E9F73] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Transfer Committed to Double-Entry Ledger</span>
              </div>
              <p className="text-[#2B2F4A] text-xs leading-relaxed">
                Transaction ID <code className="text-[#0B4FFF] font-bold">#{confirmReceipt.transaction?.transaction_id}</code> was executed atomically with paired debit and credit ledger rows.
              </p>

              <div className="p-3.5 rounded-xl bg-white border border-[#B2F5DE] font-mono text-xs space-y-1.5 text-[#1B0B5C]">
                <div>From: <span className="font-bold">{confirmReceipt.transaction?.sender_account_no}</span></div>
                <div>To: <span className="font-bold">{confirmReceipt.transaction?.receiver_account_no}</span></div>
                <div>Quantity: <span className="font-bold text-[#0B4FFF]">{confirmReceipt.transaction?.quantity} {confirmReceipt.transaction?.symbol}</span></div>
                <div>Status: <StatusChip status={confirmReceipt.transaction?.status || 'success'} size="sm" /></div>
                <div>Idempotent Replay: <span className="font-bold">{confirmReceipt.idempotentReplay ? 'YES' : 'NO'}</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setConfirmReceipt(null);
                    setPreviewData(null);
                    setTransferStatus('idle');
                  }}
                  className="flex-1 h-11 rounded-full bg-white border border-[#D5DBEE] text-[#2B2F4A] hover:bg-[#F6F8FF] font-semibold text-xs transition-colors"
                >
                  New Transfer
                </button>
                <button
                  onClick={() => router.push('/customer/history')}
                  className="flex-1 h-11 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  View in History
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

export default function CustomerTransferPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-24 flex items-center justify-center text-[#6B7090] text-sm font-medium">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0B4FFF] mr-2" />
            Loading Transfer Terminal...
          </div>
        </AppShell>
      }
    >
      <TransferForm />
    </Suspense>
  );
}
