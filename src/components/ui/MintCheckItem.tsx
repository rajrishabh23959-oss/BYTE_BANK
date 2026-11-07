import React from 'react';
import { Check } from 'lucide-react';

interface MintCheckItemProps {
  children: React.ReactNode;
  className?: string;
}

export default function MintCheckItem({ children, className = '' }: MintCheckItemProps) {
  return (
    <div className={`flex items-center gap-2.5 text-sm sm:text-base font-medium text-[#2B2F4A] ${className}`}>
      <div className="w-5 h-5 rounded-full bg-[#1FD6A0] flex items-center justify-center shrink-0 text-white shadow-sm">
        <Check className="w-3 h-3 stroke-[3]" />
      </div>
      <span>{children}</span>
    </div>
  );
}

