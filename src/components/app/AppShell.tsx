import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export default function AppShell({
  children,
  className = '',
  containerClassName = '',
}: AppShellProps) {
  return (
    <div className={`flex-1 w-full bg-[#F3F7FF] py-6 sm:py-8 ${className}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
}

