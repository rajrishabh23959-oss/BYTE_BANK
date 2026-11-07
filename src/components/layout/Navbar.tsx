'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import MarketingNavbar from './MarketingNavbar';
import {
  Wallet,
  ArrowRightLeft,
  RefreshCw,
  History,
  Lock,
  LogOut,
  Users,
  ShieldCheck,
  Scale,
  FlaskConical,
  Menu,
  X,
  User,
  Layers,
} from 'lucide-react';

interface UserSession {
  userId: number;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'AUDITOR';
  fullName?: string;
  accountNo?: string;
  kycStatus?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/' || pathname === '/about' || pathname === '/download') {
    return <MarketingNavbar />;
  }

  const [user, setUser] = useState<UserSession | null>(null);
  const [switching, setSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const handleQuickSwitch = async (role: 'CUSTOMER' | 'ADMIN' | 'AUDITOR') => {
    setSwitching(true);
    let targetEmail = 'rishi.sharma101@email.com';
    let targetPassword = 'password123';
    let redirectUrl = '/customer/dashboard';

    if (role === 'ADMIN') {
      targetEmail = 'admin@bytebank.test';
      redirectUrl = '/admin/dashboard';
    } else if (role === 'AUDITOR') {
      targetEmail = 'auditor@bytebank.test';
      redirectUrl = '/auditor/dashboard';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      if (res.ok) {
        const d = await res.json();
        setUser(d.user);
        router.push(redirectUrl);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  const customerNav = [
    { href: '/customer/dashboard', label: 'Dashboard' },
    { href: '/customer/holdings', label: 'Holdings' },
    { href: '/customer/transfer', label: 'Transfer' },
    { href: '/customer/swap', label: 'Swap' },
    { href: '/customer/history', label: 'History' },
    { href: '/customer/reservations', label: 'Reservations' },
  ];

  const adminNav = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/kyc', label: 'KYC Review' },
    { href: '/admin/accounts', label: 'Accounts' },
    { href: '/admin/assets', label: 'Assets' },
    { href: '/admin/reconciliation', label: 'Reconciliation' },
    { href: '/admin/customer-lookup', label: 'Customer Search' },
    { href: '/admin/lab', label: 'DBMS Lab' },
  ];

  const auditorNav = [
    { href: '/auditor/dashboard', label: 'Dashboard' },
    { href: '/auditor/transactions', label: 'Masked Txns' },
    { href: '/auditor/audit-logs', label: 'Audit Trail' },
    { href: '/auditor/access-logs', label: 'Access Logs' },
    { href: '/auditor/reports', label: 'Reports' },
  ];

  const activeNavList =
    user?.role === 'ADMIN'
      ? adminNav
      : user?.role === 'AUDITOR'
      ? auditorNav
      : customerNav;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 border-b border-[#E8ECF6] ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(27,11,92,0.04)]'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Image
              src="/bytebank-icon.svg"
              alt="ByteBank"
              width={32}
              height={32}
              className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#1B0B5C] uppercase font-sans">
              Byte<span className="text-[#0B4FFF]">Bank</span>
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium">
          {activeNavList.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full transition-all text-xs ${
                  isActive
                    ? 'bg-[#0B4FFF] text-white font-semibold shadow-[0_4px_14px_rgba(11,79,255,0.28)]'
                    : 'text-[#2B2F4A] hover:text-[#0B4FFF] hover:bg-[#EEF3FF]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center p-1 rounded-full bg-[#EEF1FA] border border-[#E8ECF6] text-xs font-semibold">
            <button
              onClick={() => handleQuickSwitch('CUSTOMER')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all text-xs ${
                user?.role === 'CUSTOMER'
                  ? 'bg-[#0B4FFF] text-white shadow-xs'
                  : 'text-[#6B7090] hover:text-[#1B0B5C]'
              }`}
            >
              Cust
            </button>
            <button
              onClick={() => handleQuickSwitch('ADMIN')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all text-xs ${
                user?.role === 'ADMIN'
                  ? 'bg-[#0B4FFF] text-white shadow-xs'
                  : 'text-[#6B7090] hover:text-[#1B0B5C]'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickSwitch('AUDITOR')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all text-xs ${
                user?.role === 'AUDITOR'
                  ? 'bg-[#0B4FFF] text-white shadow-xs'
                  : 'text-[#6B7090] hover:text-[#1B0B5C]'
              }`}
            >
              Audit
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'AUDITOR'
                    ? '/auditor/dashboard'
                    : '/customer/dashboard'
                }
                className="hidden sm:inline-flex px-4 py-2 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs transition-all shadow-[0_4px_16px_rgba(11,79,255,0.3)] items-center gap-1.5"
              >
                <span>Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-white hover:bg-[#FFE9EF] border border-[#E8ECF6] hover:border-[#FED0DC] text-[#6B7090] hover:text-[#D6204F] transition-all"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs text-[#2B2F4A] hover:text-[#0B4FFF] font-semibold transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-pill-primary px-4 py-2 text-xs"
              >
                Get Started
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-[#1B0B5C] hover:bg-[#EEF3FF] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E8ECF6] bg-white px-4 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#EEF1FA]">
            <span className="text-xs font-bold text-[#6B7090] uppercase tracking-wider">
              Switch Role
            </span>
            <div className="inline-flex items-center p-0.5 rounded-full bg-[#EEF1FA] border border-[#E8ECF6] text-xs font-semibold">
              <button
                onClick={() => {
                  handleQuickSwitch('CUSTOMER');
                  setMobileOpen(false);
                }}
                className={`px-2.5 py-1 rounded-full text-xs ${
                  user?.role === 'CUSTOMER'
                    ? 'bg-[#0B4FFF] text-white'
                    : 'text-[#6B7090]'
                }`}
              >
                Cust
              </button>
              <button
                onClick={() => {
                  handleQuickSwitch('ADMIN');
                  setMobileOpen(false);
                }}
                className={`px-2.5 py-1 rounded-full text-xs ${
                  user?.role === 'ADMIN'
                    ? 'bg-[#0B4FFF] text-white'
                    : 'text-[#6B7090]'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => {
                  handleQuickSwitch('AUDITOR');
                  setMobileOpen(false);
                }}
                className={`px-2.5 py-1 rounded-full text-xs ${
                  user?.role === 'AUDITOR'
                    ? 'bg-[#0B4FFF] text-white'
                    : 'text-[#6B7090]'
                }`}
              >
                Audit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {activeNavList.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0B4FFF] text-white'
                      : 'text-[#2B2F4A] hover:bg-[#EEF3FF] hover:text-[#0B4FFF]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#EEF1FA] flex items-center justify-between text-xs">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-[#FED0DC] bg-[#FFE9EF] text-[#D6204F] font-semibold text-center hover:bg-[#FDD5DF] transition-colors"
              >
                Sign Out ({user.username})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-pill-primary w-full py-2.5 text-xs text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
