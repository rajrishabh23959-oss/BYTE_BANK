'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  XCircle,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Hash,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import AppShell from '../../../components/app/AppShell';
import PageHeader from '../../../components/app/PageHeader';
import StatusChip from '../../../components/app/StatusChip';

export default function AdminKycPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectModalCustomer, setRejectModalCustomer] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchKycList = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' ? '/api/admin/kyc' : `/api/admin/kyc?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err: any) {
      setMessage({ text: 'Failed to fetch KYC records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, [statusFilter]);

  const handleUpdateStatus = async (customerId: number, status: 'verified' | 'rejected', reason?: string) => {
    try {
      setProcessingId(customerId);
      setMessage(null);

      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          status,
          rejectionReason: reason || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error?.message || 'Failed to update KYC status.', type: 'error' });
        return;
      }

      setMessage({
        text: `Customer #${customerId} successfully updated to ${status.toUpperCase()}! (Audit trigger logged)`,
        type: 'success',
      });
      setRejectModalCustomer(null);
      setRejectionReason('');
      fetchKycList();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating KYC.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="KYC Verification Operations"
        subtitle="Review synthetic customer identification hashes, verify documentation, and approve account trading capabilities."
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
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EEF1FA]">
          {(['pending', 'verified', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
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
          onClick={fetchKycList}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF3FF] border border-[#E8ECF6] text-xs font-mono text-[#0B4FFF] font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0B4FFF] inline mr-2" />
            Querying PostgreSQL Customer Registry...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-[#6B7090] text-xs font-mono">
            No customers found matching filter &quot;{statusFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FF] border-b border-[#E8ECF6] text-[#6B7090] uppercase tracking-wider text-[11px] font-semibold font-mono">
                <tr>
                  <th className="py-3.5 px-4">Cust ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">ID Proof (SHA-256)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1FA] text-[#2B2F4A]">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-[#F6F8FF] transition-colors h-14">
                    <td className="py-3 px-4 font-mono font-bold text-[#0B4FFF]">
                      CUST{c.customer_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#1B0B5C] font-semibold">{c.full_name}</div>
                      <div className="text-[10px] text-[#6B7090] font-mono">DOB: {c.dob}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#2B2F4A]">{c.email}</div>
                      <div className="text-[10px] text-[#6B7090] font-mono">{c.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#6B7090]">
                        <Hash className="w-3.5 h-3.5 text-[#0B4FFF] shrink-0" />
                        <span className="font-mono text-[10px] bg-[#EEF3FF] text-[#0B4FFF] px-2 py-0.5 rounded-full border border-[#B9C6FF] truncate max-w-[140px]">
                          {c.id_proof_hash}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={c.kyc_status} />
                    </td>
                    <td className="py-3 px-4 text-[#6B7090] text-[11px] font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.kyc_status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(c.customer_id, 'verified')}
                            disabled={processingId === c.customer_id}
                            className="px-3 py-1.5 rounded-full bg-[#1FD6A0] hover:bg-[#19b98a] text-white text-[11px] font-bold font-mono transition-colors inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalCustomer(c)}
                            disabled={processingId === c.customer_id}
                            className="px-3 py-1.5 rounded-full bg-[#F43F6E] hover:bg-[#d6204f] text-white text-[11px] font-bold font-mono transition-colors inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#6B7090] text-[11px] font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModalCustomer && (
        <div className="fixed inset-0 z-50 bg-[#1B0B5C]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="p-6 rounded-2xl bg-white border border-[#E8ECF6] shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#D6204F] font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Reject KYC for {rejectModalCustomer.full_name}</span>
            </div>

            <p className="text-xs text-[#6B7090] leading-relaxed">
              Provide a formal compliance rejection reason. This reason will be written to the database audit log and visible to the customer.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. ID proof hash unreadable or expired document."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#F6F8FF] border border-[#E1E6F5] focus:border-[#0B4FFF] rounded-xl p-3 text-[#1B0B5C] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0B4FFF]/20"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalCustomer(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-full bg-[#F6F8FF] hover:bg-[#EEF1FA] text-[#2B2F4A] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(
                    rejectModalCustomer.customer_id,
                    'rejected',
                    rejectionReason || 'Document verification failed.'
                  )
                }
                disabled={processingId === rejectModalCustomer.customer_id}
                className="px-5 py-2 rounded-full bg-[#F43F6E] hover:bg-[#d6204f] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
