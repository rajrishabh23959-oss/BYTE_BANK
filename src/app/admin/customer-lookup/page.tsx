'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldAlert,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  Clock,
  History,
  AlertTriangle,
  Lock,
  CheckCircle2,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import SectionCard from '../../../components/app/SectionCard';
import StatusChip from '../../../components/app/StatusChip';

const PURPOSE_OPTIONS = [
  { code: 'KYC_VERIFICATION', label: 'KYC Verification (Document Authenticity Check)' },
  { code: 'FRAUD_INVESTIGATION', label: 'Fraud & Anti-Money Laundering (AML) Investigation' },
  { code: 'CUSTOMER_SUPPORT_INQUIRY', label: 'Customer Support Request (Ticketed Query)' },
  { code: 'COURT_ORDER_LEGAL', label: 'Legal Subpoena / Regulatory Court Order' },
  { code: 'AUDIT_COMPLIANCE_REVIEW', label: 'Periodic Internal Compliance Review' },
];

export default function CustomerLookupPage() {
  const [queryInput, setQueryInput] = useState('');
  const [purposeCode, setPurposeCode] = useState(PURPOSE_OPTIONS[0].code);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [accessLogged, setAccessLogged] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) {
      setError('Please provide a Customer ID, Account Number, or Email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setAccessLogged(null);

      let payload: any = { purposeCode };
      const trimmed = queryInput.trim();
      if (trimmed.startsWith('BB-ACC-') || trimmed.startsWith('ACC-')) {
        payload.accountNo = trimmed;
      } else if (trimmed.includes('@')) {
        payload.email = trimmed;
      } else {
        const num = parseInt(trimmed.replace(/\D/g, ''), 10);
        if (!isNaN(num)) payload.customerId = num;
        else payload.email = trimmed;
      }

      const res = await fetch('/api/admin/customer-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Customer lookup failed.');
        return;
      }

      setResult(data);
      setAccessLogged({
        purposeCode,
        timestamp: new Date().toLocaleTimeString(),
        staffRole: 'ADMIN',
      });
    } catch (err: any) {
      setError(err.message || 'Network error during customer lookup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Customer Profile & KYC Lookup"
        subtitle="Access customer PII and portfolio history through a controlled, purpose-coded database API path."
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

      <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-6">
        <div className="p-4 rounded-xl bg-[#FEF3C7]/50 border border-[#FDE68A] text-[#92400E] text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[#B45309]">Privacy &amp; Compliance Requirement:</div>
            <p className="text-[11px] leading-relaxed text-[#92400E]">
              By submitting this query, your staff session credentials and specified purpose code will be immutably recorded into the PostgreSQL <code className="text-[#0B4FFF] font-mono font-bold">access_log</code> table for independent audit by regulatory compliance officers.
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 space-y-1.5">
              <label className="text-xs font-semibold text-[#2B2F4A]">
                Customer Identifier (Customer ID, Account No, or Email)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#6B7090] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST101, BB-ACC-5001, or rahul.sharma@example.com"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl pl-9 pr-3 py-2.5 text-[#1B0B5C] font-mono text-xs focus:outline-none focus:border-[#0B4FFF] focus:ring-2 focus:ring-[#0B4FFF]/20"
                />
              </div>
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-[#2B2F4A]">Mandatory Access Purpose Code</label>
              <select
                value={purposeCode}
                onChange={(e) => setPurposeCode(e.target.value)}
                className="w-full bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl px-3 py-2.5 text-[#1B0B5C] text-xs focus:outline-none focus:border-[#0B4FFF] focus:ring-2 focus:ring-[#0B4FFF]/20"
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs font-mono text-[#6B7090]">
              Try seeded master accounts: <span className="text-[#0B4FFF] font-bold">CUST101</span>, <span className="text-[#0B4FFF] font-bold">CUST104</span>, or <span className="text-[#0B4FFF] font-bold">BB-ACC-5004</span>
            </div>

            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="px-6 py-2.5 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 h-11"
            >
              {loading ? 'Logging & Querying...' : 'Execute Logged Lookup'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FFE9EF] border border-[#FECDD3] text-[#D6204F] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D6204F] shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {accessLogged && (
        <div className="p-4 rounded-2xl bg-[#EEF3FF] border border-[#B9C6FF] text-[#0B4FFF] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#0B4FFF] shrink-0" />
            <span>
              Access verified and committed to PostgreSQL <code className="font-bold">access_log</code> at {accessLogged.timestamp} with purpose: <code className="font-bold">{accessLogged.purposeCode}</code>.
            </span>
          </div>
          <Link
            href="/auditor/access-logs"
            className="text-xs text-[#0B4FFF] font-bold hover:underline flex items-center gap-1 shrink-0"
          >
            Verify in Auditor Log &rarr;
          </Link>
        </div>
      )}

      {result && result.customer && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF3FF] border border-[#B9C6FF] text-[#0B4FFF] flex items-center justify-center font-mono font-bold text-lg">
                  {result.customer.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1B0B5C]">{result.customer.full_name}</h2>
                  <div className="text-xs font-mono text-[#0B4FFF] font-bold">
                    ID: CUST{result.customer.customer_id}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EEF1FA] text-xs font-mono text-[#2B2F4A]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#6B7090]" />
                  <span>{result.customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#6B7090]" />
                  <span>{result.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#6B7090]" />
                  <span>DOB: {result.customer.dob}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#6B7090] shrink-0 mt-0.5" />
                  <span className="text-[#6B7090] text-[11px]">{result.customer.address}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white space-y-4">
              <h3 className="text-xs font-mono text-[#6B7090] uppercase tracking-wider font-bold">
                Account &amp; Compliance Status
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7090]">Account No:</span>
                  <span className="text-[#1B0B5C] font-bold">{result.account?.account_no}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6B7090]">Account Status:</span>
                  <StatusChip status={result.account?.status} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6B7090]">KYC Status:</span>
                  <StatusChip status={result.customer?.kyc_status} />
                </div>

                <div className="pt-2 border-t border-[#EEF1FA]">
                  <div className="text-[#6B7090] text-[10px]">ID Proof Hash (SHA-256):</div>
                  <div className="p-2 mt-1 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] text-[10px] text-[#0B4FFF] break-all font-mono">
                    {result.customer?.id_proof_hash}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono text-[#6B7090] uppercase tracking-wider font-bold">
                  Portfolio Valuation
                </h3>
                <div className="text-3xl font-extrabold text-[#1B0B5C] font-mono mt-3 tabular-nums">
                  ${result.holdings?.reduce((acc: number, h: any) => acc + (parseFloat(h.quantity) * parseFloat(h.sim_ref_price)), 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-[11px] text-[#6B7090] font-mono mt-1">
                  Simulated Reference Valuation
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F6F8FF] border border-[#E8ECF6] text-[11px] font-mono text-[#6B7090]">
                Holdings across {result.holdings?.length || 0} distinct digital asset categories.
              </div>
            </div>
          </div>

          <SectionCard title="Customer Asset Holdings">
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Asset Class</th>
                    <th className="py-3 px-4 text-right">Total Quantity</th>
                    <th className="py-3 px-4 text-right">Available Qty</th>
                    <th className="py-3 px-4 text-right">Simulated Ref Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                  {result.holdings?.map((h: any) => (
                    <tr key={h.asset_id} className="hover:bg-[#F6F8FF] transition-colors h-12">
                      <td className="py-2.5 px-4 font-bold text-[#1B0B5C]">{h.symbol}</td>
                      <td className="py-2.5 px-4 text-[#6B7090]">{h.name}</td>
                      <td className="py-2.5 px-4 uppercase text-[10px] font-bold">{h.type}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#1B0B5C] tabular-nums">
                        {parseFloat(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#0E9F73] font-bold tabular-nums">
                        {parseFloat(h.available_qty || h.quantity).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#6B7090] tabular-nums">
                        ${parseFloat(h.sim_ref_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Recent Transactions (Last 10)">
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tx ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                  {result.transactions?.map((tx: any) => (
                    <tr key={tx.transaction_id} className="hover:bg-[#F6F8FF] transition-colors h-12">
                      <td className="py-2.5 px-4 text-[#0B4FFF] font-bold">#{tx.transaction_id}</td>
                      <td className="py-2.5 px-4 uppercase text-[10px] font-bold">{tx.type}</td>
                      <td className="py-2.5 px-4 text-[#1B0B5C] font-bold">{tx.symbol}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-bold">
                        {parseFloat(tx.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusChip status={tx.status} />
                      </td>
                      <td className="py-2.5 px-4 text-right text-[#6B7090] text-[10px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
