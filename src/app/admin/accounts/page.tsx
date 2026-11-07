'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  Unlock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import StatusChip from '../../../components/app/StatusChip';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen'>('all');
  const [actionModal, setActionModal] = useState<{
    account: any;
    action: 'freeze' | 'unfreeze';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/accounts');
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (err: any) {
      setMessage({ text: 'Failed to load accounts list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    if (!actionReason.trim()) {
      setMessage({ text: 'A formal compliance reason is required.', type: 'error' });
      return;
    }

    try {
      setProcessing(true);
      setMessage(null);

      const res = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: actionModal.account.account_id,
          action: actionModal.action,
          reason: actionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Failed to update account.', type: 'error' });
        return;
      }

      setMessage({
        text: `Account ${actionModal.account.account_no} was successfully ${actionModal.action}d. Audit log recorded.`,
        type: 'success',
      });
      setActionModal(null);
      setActionReason('');
      fetchAccounts();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating account status.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <PageHeader
        title="Account Management"
        subtitle="Enforce compliance freezes, review holdings distribution, and audit account status history."
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

      <div className="p-4 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#6B7090] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by account number, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F6F8FF] border border-[#E1E6F5] rounded-xl pl-9 pr-3 py-2.5 text-[#1B0B5C] placeholder-[#6B7090] text-xs focus:outline-none focus:border-[#0B4FFF] focus:ring-2 focus:ring-[#0B4FFF]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EEF1FA]">
            {(['all', 'active', 'frozen'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-[#0B4FFF] text-white shadow-xs'
                    : 'text-[#6B7090] hover:text-[#1B0B5C]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAccounts}
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
            Reading Account Registry from PostgreSQL...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            No accounts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold font-mono">
                <tr>
                  <th className="py-3.5 px-4">Account No</th>
                  <th className="py-3.5 px-4">Owner / Customer</th>
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Simulated Valuation</th>
                  <th className="py-3.5 px-4">Holdings</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.account_id} className="hover:bg-[#F6F8FF] transition-colors h-14">
                    <td className="py-3 px-4 font-mono font-bold text-[#0B4FFF]">
                      {acc.account_no}
                      {acc.is_system && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[9px] font-bold">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#1B0B5C] font-semibold">
                        {acc.customer_name || 'System Entity'}
                      </div>
                      <div className="text-[10px] text-[#6B7090] font-mono">
                        {acc.customer_email || 'treasury@bytebank.sim'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-[#EEF1FA] text-[#1B0B5C] font-mono uppercase text-[10px] font-bold">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={acc.status} />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1B0B5C] tabular-nums">
                      ${parseFloat(acc.total_portfolio_value_sru || '0').toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#6B7090] font-mono">
                      {acc.holdings_count || 0} distinct assets
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!acc.is_system && (
                        acc.status === 'active' ? (
                          <button
                            onClick={() => setActionModal({ account: acc, action: 'freeze' })}
                            className="px-3 py-1.5 rounded-full bg-[#FFE9EF] hover:bg-[#F43F6E] text-[#D6204F] hover:text-white border border-[#FECDD3] text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Freeze</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActionModal({ account: acc, action: 'unfreeze' })}
                            className="px-3 py-1.5 rounded-full bg-[#E6FBF4] hover:bg-[#1FD6A0] text-[#0E9F73] hover:text-white border border-[#99F6E4] text-[11px] font-mono font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unfreeze</span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-50 bg-[#1B0B5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#1B0B5C] font-bold text-sm">
              <ShieldAlert
                className={`w-5 h-5 ${
                  actionModal.action === 'freeze' ? 'text-[#D6204F]' : 'text-[#0E9F73]'
                }`}
              />
              <span className="capitalize">
                {actionModal.action} Account ({actionModal.account.account_no})
              </span>
            </div>

            <p className="text-xs text-[#6B7090] leading-relaxed">
              {actionModal.action === 'freeze'
                ? 'Freezing this account blocks all outbound transfers and swaps immediately. The risk screening engine will reject transactions targeting this account.'
                : 'Unfreezing will restore transfer and swap permissions for this customer.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2B2F4A]">
                Compliance Reason (Logged in audit_log):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Account security review / Suspicious activity report #104"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl p-3 text-[#1B0B5C] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setActionReason('');
                }}
                className="px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF1FA] text-[#2B2F4A] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={processing || !actionReason.trim()}
                className={`px-5 py-2 rounded-full text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${
                  actionModal.action === 'freeze'
                    ? 'bg-[#F43F6E] hover:bg-[#d6204f]'
                    : 'bg-[#1FD6A0] hover:bg-[#19b98a]'
                }`}
              >
                {processing ? 'Applying...' : `Confirm ${actionModal.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
