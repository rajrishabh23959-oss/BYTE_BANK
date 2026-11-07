'use client';

import React, { useState } from 'react';
import { Copy, Check, Cpu } from 'lucide-react';

const CODE_EXAMPLES = {
  curl: `curl -X POST http://localhost:3000/api/customer/transfer \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: c9b2a1e4-3b56-4c8d-9f12-001122334455" \\
  -H "Authorization: Bearer \${ACCESS_TOKEN}" \\
  -d '{
    "toAccountNo": "BB-ACC-5002",
    "symbol": "BTC",
    "quantity": "0.10000000"
  }'`,
  node: `const response = await fetch('http://localhost:3000/api/customer/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
    'Authorization': \`Bearer \${token}\`
  },
  body: JSON.stringify({
    toAccountNo: 'BB-ACC-5002',
    symbol: 'ETH',
    quantity: '1.50000000'
  })
});
const data = await response.json();`,
  sql: `-- Direct PostgreSQL 16 ACID Transaction:
BEGIN;
SELECT holding.quantity - COALESCE(SUM(ar.quantity), 0)
  FROM holding
  LEFT JOIN asset_reservation ar 
    ON ar.account_id = holding.account_id 
   AND ar.asset_id = holding.asset_id 
   AND ar.status = 'active'
 WHERE holding.account_id = 5001 AND holding.asset_id = 1
 FOR UPDATE;

INSERT INTO ledger_entry (account_id, asset_id, amount, balance_after)
VALUES (5001, 1, -0.10000000, 0.90000000);
COMMIT;`,
};

export default function ApiCliSection() {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'sql'>('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E8ECF6]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7FF] border border-[#E8ECF6] text-xs font-semibold text-[#0B4FFF]">
            <Cpu className="w-3.5 h-3.5" />
            <span>Developer-First Platform</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
            TRANSACTION API &amp; POSTGRESQL DRIVER
          </h2>
          <p className="text-sm text-[#6B7090] leading-relaxed">
            Execute transfers through standard REST routes or interface directly with PostgreSQL 16 using parameterized transactions and row-level locks.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white overflow-hidden">
          <div className="px-5 py-3.5 bg-[#F3F7FF] border-b border-[#E8ECF6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FFAB2E]" />
              <span className="w-3 h-3 rounded-full bg-[#1FD6A0]" />
              <span className="w-3 h-3 rounded-full bg-[#3B5BFF]" />
              <span className="text-xs font-mono text-[#6B7090] ml-2">bash &mdash; bytebank-client</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8ECF6]">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    activeTab === 'curl' ? 'bg-[#0B4FFF] text-white font-semibold' : 'text-[#6B7090] hover:text-[#1B0B5C]'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab('node')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    activeTab === 'node' ? 'bg-[#0B4FFF] text-white font-semibold' : 'text-[#6B7090] hover:text-[#1B0B5C]'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                    activeTab === 'sql' ? 'bg-[#0B4FFF] text-white font-semibold' : 'text-[#6B7090] hover:text-[#1B0B5C]'
                  }`}
                >
                  Raw SQL
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white border border-[#E8ECF6] text-[#6B7090] hover:text-[#1B0B5C] transition-colors"
                title="Copy snippet"
              >
                {copied ? <Check className="w-4 h-4 text-[#1FD6A0]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-6 font-mono text-xs text-[#1B0B5C] overflow-x-auto leading-relaxed bg-[#F6F8FF]">
            <pre className="text-[#0B4FFF] font-semibold">{CODE_EXAMPLES[activeTab]}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}
