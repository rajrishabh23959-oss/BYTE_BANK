import React from 'react';
import Link from 'next/link';

export default function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center gap-2.5 select-none hover:opacity-95 transition-opacity ${className}`}
      aria-label="ByteBank Home"
    >
      <svg
        viewBox="0 0 40 40"
        className="w-9 h-9 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#0B4FFF" />
        <path
          d="M13 10V30M13 10H22C24.7614 10 27 12.2386 27 15C27 17.7614 24.7614 20 22 20H13M13 20H23.5C26.5376 20 29 22.2386 29 25C29 27.7614 26.5376 30 23.5 30H13"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="11" r="2.5" fill="#1FD6A0" />
      </svg>
      <span className="flex items-baseline text-2xl font-extrabold tracking-tight font-sans">
        <span className="text-[#1B0B5C]">Byte</span>
        <span className="text-[#0B4FFF]">Bank</span>
      </span>
    </Link>
  );
}

