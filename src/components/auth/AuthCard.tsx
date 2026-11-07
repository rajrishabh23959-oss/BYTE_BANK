import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export default function AuthCard({
  children,
  className = '',
  maxWidth = 'max-w-[560px]',
}: AuthCardProps) {
  return (
    <div className={`relative w-full ${maxWidth} mx-auto my-auto ${className}`}>
      <div
        className="absolute -inset-1 rounded-[26px] auth-ambient-glow pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative w-full rounded-[20px] p-[2px] auth-border-beam shadow-[0_12px_40px_rgba(27,11,92,0.08)]">
        <div className="w-full bg-white rounded-[18px] p-7 sm:p-10 text-[#2B2F4A]">
          {children}
        </div>
      </div>
    </div>
  );
}

