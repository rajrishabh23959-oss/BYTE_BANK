'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, User } from 'lucide-react';

export default function MarketingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ role: string; fullName?: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E8ECF6]'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Image
              src="/bytebank-icon.svg"
              alt="ByteBank"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1B0B5C] uppercase font-sans">
            Byte<span className="text-[#0B4FFF]">Bank</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium">
          <Link
            href="/"
            className={`transition-colors font-medium ${
              pathname === '/'
                ? 'text-[#0B4FFF] font-semibold'
                : 'text-[#1B0B5C] hover:text-[#0B4FFF]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/download"
            className={`transition-colors font-medium ${
              pathname === '/download'
                ? 'text-[#0B4FFF] font-semibold'
                : 'text-[#1B0B5C] hover:text-[#0B4FFF]'
            }`}
          >
            Download
          </Link>
          <Link
            href="/about"
            className={`transition-colors font-medium ${
              pathname === '/about'
                ? 'text-[#0B4FFF] font-semibold'
                : 'text-[#1B0B5C] hover:text-[#0B4FFF]'
            }`}
          >
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              href={
                user.role === 'ADMIN'
                  ? '/admin/dashboard'
                  : user.role === 'AUDITOR'
                  ? '/auditor/dashboard'
                  : '/customer/dashboard'
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F3F7FF] border border-[#E8ECF6] text-[#1B0B5C] font-semibold text-sm hover:border-[#0B4FFF] transition-colors"
            >
              <User className="w-4 h-4 text-[#0B4FFF]" />
              <span>{user.fullName || user.role}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="btn-pill-primary px-7 py-3 text-sm"
            >
              Get Started
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#1B0B5C] hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8ECF6] bg-white px-4 py-6 space-y-4">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-[#0B4FFF]"
          >
            Home
          </Link>
          <Link
            href="/download"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#1B0B5C] hover:text-[#0B4FFF]"
          >
            Download
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-[#1B0B5C] hover:text-[#0B4FFF]"
          >
            About
          </Link>
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-pill-primary w-full py-3 text-sm text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
