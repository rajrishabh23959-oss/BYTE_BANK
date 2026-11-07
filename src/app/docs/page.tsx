'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import AppShell from '../../components/app/AppShell';
import PageHeader from '../../components/app/PageHeader';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((r) => r.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const copyCurl = (path: string, method: string) => {
    const curl = `curl -X ${method.toUpperCase()} http://localhost:3000${path} -H "Content-Type: application/json"`;
    navigator.clipboard.writeText(curl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center py-24 text-[#6B7090] font-mono text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0B4FFF] mr-2" />
          Loading OpenAPI Specification...
        </div>
      </AppShell>
    );
  }

  const paths = spec?.paths || {};

  return (
    <AppShell>
      <PageHeader
        title="ByteBank API Reference"
        subtitle="Standardized endpoints for authentication, rule-based transfer preview, retry-safe settlement, and staff audits."
        actions={
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#EEF3FF] border border-[#0B4FFF] text-[#0B4FFF] text-xs font-bold transition-all shadow-xs h-11"
          >
            <Code className="w-4 h-4" />
            <span>Raw OpenAPI JSON</span>
            <ExternalLink className="w-3 h-3 text-[#6B7090]" />
          </a>
        }
      />

      <div className="space-y-4">
        {Object.entries(paths).map(([path, methods]: [string, any]) => {
          return Object.entries(methods).map(([method, details]: [string, any]) => {
            const methodUpper = method.toUpperCase();
            const methodColor =
              methodUpper === 'GET'
                ? 'bg-[#EEF3FF] border-[#B9C6FF] text-[#0B4FFF]'
                : methodUpper === 'POST'
                ? 'bg-[#E6FBF4] border-[#99F6E4] text-[#0E9F73]'
                : methodUpper === 'PATCH'
                ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                : 'bg-[#FFE9EF] border-[#FECDD3] text-[#D6204F]';

            return (
              <div
                key={`${path}-${method}`}
                className="p-5 rounded-2xl bg-white border border-[#E8ECF6] shadow-card-white hover:shadow-card-hover hover:border-[#0B4FFF] transition-all space-y-3 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border ${methodColor}`}
                    >
                      {methodUpper}
                    </span>
                    <span className="text-[#1B0B5C] font-bold text-sm">{path}</span>
                  </div>

                  <button
                    onClick={() => copyCurl(path, method)}
                    className="text-[#6B7090] hover:text-[#0B4FFF] text-[11px] flex items-center gap-1 self-start sm:self-auto transition-colors"
                  >
                    {copiedPath === path ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9F73]" />
                        <span className="text-[#0E9F73] font-bold">Copied cURL!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[#2B2F4A] font-sans text-xs leading-relaxed">
                  {details.summary || details.description}
                </div>

                {details.parameters && (
                  <div className="pt-3 border-t border-[#EEF1FA] space-y-1.5">
                    <span className="text-[10px] text-[#6B7090] uppercase tracking-wider font-bold">
                      Headers / Parameters:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {details.parameters.map((p: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-[#F6F8FF] border border-[#E8ECF6] text-[#0B4FFF] text-[10px] font-mono"
                        >
                          {p.name} {p.required && <strong className="text-[#D6204F]">*</strong>} (
                          {p.in})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })}
      </div>
    </AppShell>
  );
}
