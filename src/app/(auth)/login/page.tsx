'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import AuthCard from '@/components/auth/AuthCard';
import TextField from '@/components/auth/TextField';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Login failed. Check your credentials.');
        return;
      }

      if (data.user?.role === 'ADMIN') router.push('/admin/dashboard');
      else if (data.user?.role === 'AUDITOR') router.push('/auditor/dashboard');
      else router.push('/customer/dashboard');

      router.refresh();
    } catch {
      setError('Connection failed. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F7FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <AuthCard maxWidth="max-w-[480px]">
        <div className="text-center mb-6">
          <BrandLogo className="mx-auto mb-2" />
          <p className="text-xs text-[#6B7090] font-medium">
            PostgreSQL Authenticated Digital Asset Account
          </p>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1B0B5C] tracking-tight">
            Sign In to ByteBank
          </h1>
          <p className="text-sm text-[#6B7090] mt-1">
            Access your simulated digital ledger and transaction console.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#D6204F] text-xs leading-relaxed"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextField
            id="loginEmail"
            label="Email Address or Username"
            value={email}
            onChangeValue={setEmail}
            placeholder="rishi.sharma101@email.com or admin"
            autoComplete="username"
            required
            icon={Mail}
          />

          <TextField
            id="loginPassword"
            type="password"
            label="Password"
            value={password}
            onChangeValue={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            icon={Lock}
          />

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className={`w-full h-[52px] rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-6 shadow-md ${!loading && email.trim() && password
                ? 'bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white hover:-translate-y-0.5'
                : 'bg-[#B9C6FF] text-white cursor-not-allowed'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E8ECF6] text-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7090] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0B4FFF]" />
            <span>Click to Autofill Demo Roles:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('rishi.sharma101@email.com')}
              className="p-2.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] hover:border-[#0B4FFF] text-left transition-colors group"
            >
              <div className="font-bold text-xs text-[#0B4FFF] group-hover:underline">
                Customer
              </div>
              <div className="text-[10px] text-[#6B7090] truncate mt-0.5">
                Rishi Sharma
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('admin@bytebank.test')}
              className="p-2.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] hover:border-[#FFAB2E] text-left transition-colors group"
            >
              <div className="font-bold text-xs text-[#FFAB2E] group-hover:underline">
                Admin
              </div>
              <div className="text-[10px] text-[#6B7090] truncate mt-0.5">
                Vikram Desai
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('auditor@bytebank.test')}
              className="p-2.5 rounded-xl bg-[#F6F8FF] border border-[#E1E6F5] hover:border-[#7C3AED] text-left transition-colors group"
            >
              <div className="font-bold text-xs text-[#7C3AED] group-hover:underline">
                Auditor
              </div>
              <div className="text-[10px] text-[#6B7090] truncate mt-0.5">
                Karthik Menon
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#6B7090]">
          Need an account?{' '}
          <Link
            href="/register"
            className="text-[#0B4FFF] font-semibold hover:underline"
          >
            Register new customer
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
