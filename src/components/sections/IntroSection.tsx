import React from 'react';

export default function IntroSection() {
  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white text-center">
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1B0B5C] uppercase font-sans">
          Storing and managing your digital assets made easier
        </h2>
        <p className="text-base sm:text-lg text-[#6B7090] font-normal leading-relaxed max-w-2xl mx-auto">
          A transparent relational database architecture enforcing append-only financial accounting and deterministic risk screening.
        </p>
      </div>
    </section>
  );
}

