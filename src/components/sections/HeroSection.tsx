'use client';

import React from 'react';
import Link from 'next/link';
import MintCheckItem from '@/components/ui/MintCheckItem';
import MintDotGrid from '@/components/ui/MintDotGrid';
import WaveDivider from '@/components/ui/WaveDivider';
import HeroDonutChart from '@/components/charts/HeroDonutChart';
import HeroBarChart from '@/components/charts/HeroBarChart';

interface HeroSectionProps {
  metrics: {
    totalAccounts: number;
    totalTransactions: number;
    totalLedgerEntries: number;
    supportedAssetsCount: number;
    assetCategories: { name: string; value: number; color: string }[];
    monthlyBars: { month: string; count: number; isHighlighted?: boolean }[];
  } | null;
}

export default function HeroSection({ metrics }: HeroSectionProps) {
  return (
    <section className="relative w-full pt-12 pb-0 bg-white overflow-hidden">
      <div className="absolute top-0 left-0 w-[55%] h-[85%] hero-blob-gradient pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[580px]">
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1B0B5C] uppercase font-sans leading-[1.05]">
                THE WORLD IN<br />YOUR WALLET
              </h1>
              <p className="text-lg sm:text-xl text-[#6B7090] font-normal leading-relaxed max-w-lg">
                Get your first digital wallet in ByteBank.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pt-1">
              <MintCheckItem>Payment made easy</MintCheckItem>
              <MintCheckItem>Simulated assets, real database rules</MintCheckItem>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="btn-pill-primary px-9 py-4 text-base"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px]">
              <MintDotGrid
                cols={8}
                rows={6}
                className="absolute -top-10 -right-6 z-0"
              />

              <div className="relative z-10 w-full pr-10 pb-16">
                <HeroDonutChart
                  categories={metrics?.assetCategories}
                  totalCount={metrics?.supportedAssetsCount || 10}
                />
              </div>

              <div className="absolute -bottom-2 right-0 w-[78%] z-20">
                <HeroBarChart monthlyData={metrics?.monthlyBars} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaveDivider fill="#FFFFFF" direction="down" className="mt-16" />
    </section>
  );
}
