'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'What is ByteBank and why are balances simulated?',
    a: 'ByteBank is a database-backed asset and transaction ledger built on PostgreSQL 16. It implements double-entry bookkeeping, strict ACID serialization, and rule-based risk screening. All balances and KYC tokens are simulated for educational database architecture verification.',
  },
  {
    q: 'How does the double-entry ledger prevent balance drift?',
    a: 'Every balance modification writes a paired debit and credit ledger entry within a single atomic database transaction. Holdings are dynamically derived from SUM(ledger_entry). A database trigger strictly forbids UPDATE and DELETE on ledger rows, guaranteeing an append-only audit trail.',
  },
  {
    q: 'How does row-level locking prevent concurrency double-spending?',
    a: 'During transfers, ByteBank executes SELECT holding.quantity ... FOR UPDATE on the sender row. If two concurrent requests attempt to spend the same balance, PostgreSQL serializes them: the first commits and the second fails cleanly with an Insufficient Balance error.',
  },
  {
    q: 'What are the default role accounts and login credentials?',
    a: 'All accounts use password "password123":\n• Customer: rishi.sharma101@email.com (Account BB-ACC-5001)\n• Counterparty: rahul.verma102@email.com (Account BB-ACC-5002)\n• Admin: admin@bytebank.test\n• Auditor: auditor@bytebank.test',
  },
  {
    q: 'How does the transaction safety risk preview work?',
    a: 'Before any transfer executes, ByteBank evaluates versioned database risk rules: sender KYC status, recipient account status, velocity limits, and available balance. An assessment row stores the rule ID, version, and outcome reasons.',
  },
  {
    q: 'Where can I download the complete PostgreSQL schema and dataset?',
    a: 'Visit the /download page to export the production PostgreSQL 16 schema SQL migrations, the 125-customer master dataset CSV, and the OpenAPI 3.1 JSON specification.',
  },
];

export default function BetaDropFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E8ECF6]">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7FF] border border-[#E8ECF6] text-xs font-semibold text-[#0B4FFF]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Architecture FAQ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-sm text-[#6B7090]">
            Common questions about ByteBank simulated digital asset architecture and ledger rules
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#1B0B5C] hover:text-[#0B4FFF] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6B7090] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0B4FFF]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#2B2F4A] whitespace-pre-line leading-relaxed border-t border-[#F3F7FF]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
