import React from 'react';
import { ArrowRightLeft, ShieldCheck, Scale } from 'lucide-react';

const FEATURES = [
  {
    icon: ArrowRightLeft,
    title: 'TRANSFER & PAYMENT',
    desc: 'Two-phase asset transfers with atomic balance reservations and row-level locking.',
  },
  {
    icon: ShieldCheck,
    title: 'SECURITY SUPERVISION',
    desc: 'Rule-based risk screening evaluated and version-tracked before every transfer.',
  },
  {
    icon: Scale,
    title: 'AUDIT & RECONCILIATION',
    desc: 'Double-entry ledger matching where holdings equal sum of entries with zero drift.',
  },
];

export default function FeatureCardsSection() {
  return (
    <section className="w-full pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {FEATURES.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-[#E8ECF6] shadow-card-white p-8 transition-transform hover:-translate-y-1 duration-200"
            >
              <div className="w-12 h-12 rounded-xl border border-[#E8ECF6] bg-[#F3F7FF] flex items-center justify-center text-[#1B0B5C] mb-6 shadow-sm">
                <Icon className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-[#1B0B5C] tracking-tight uppercase font-sans mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-[#6B7090] leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
