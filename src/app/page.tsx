'use client';

import React, { useState, useEffect } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import IntroSection from '@/components/sections/IntroSection';
import FeatureCardsSection from '@/components/sections/FeatureCardsSection';
import ManageFinancesSection from '@/components/sections/ManageFinancesSection';
import AssetTransactionsSection from '@/components/sections/AssetTransactionsSection';
import SecuritySection from '@/components/sections/SecuritySection';
import ApiCliSection from '@/components/sections/ApiCliSection';
import BetaDropFAQ from '@/components/sections/BetaDropFAQ';
import BetaDropCTA from '@/components/sections/BetaDropCTA';

export default function MarketingLandingPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.metrics) {
          setMetrics(data.metrics);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full bg-white text-[#2B2F4A] flex flex-col">
      <HeroSection metrics={metrics} />
      <IntroSection />
      <FeatureCardsSection />
      <ManageFinancesSection metrics={metrics} />
      <AssetTransactionsSection metrics={metrics} />
      <SecuritySection />
      <ApiCliSection />
      <BetaDropFAQ />
      <BetaDropCTA />
    </div>
  );
}
