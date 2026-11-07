import React from 'react';
import Link from 'next/link';
import { Download, Database, FileSpreadsheet, Code, ArrowRight } from 'lucide-react';
import WaveDivider from '@/components/ui/WaveDivider';

export const metadata = {
  title: 'Download Architecture & Data Packs | ByteBank',
  description: 'Download the complete PostgreSQL 16 schema, 125-customer synthetic dataset, and OpenAPI specification.',
};

const DOWNLOADS = [
  {
    title: 'Complete PostgreSQL 16 Schema Pack',
    filename: 'bytebank-complete-schema.sql',
    format: 'SQL DDL & Triggers',
    size: '46 KB',
    desc: 'All migrations containing table definitions, CHECK constraints, immutability triggers, PL/pgSQL transfer procedures, and Row-Level Security policies.',
    url: '/api/download/schema',
    icon: Database,
    color: 'text-[#0B4FFF]',
    bgColor: 'bg-[#F3F7FF]',
  },
  {
    title: '125 Master Customer Synthetic Dataset',
    filename: 'bytebank-125-customers.csv',
    format: 'CSV Spreadsheet',
    size: '18 KB',
    desc: 'The complete seeded dataset of 125 synthetic master customers with unique emails, phone numbers, verified KYC statuses, and generated account numbers.',
    url: '/api/download/dataset',
    icon: FileSpreadsheet,
    color: 'text-[#1FD6A0]',
    bgColor: 'bg-[#1FD6A0]/10',
  },
  {
    title: 'OpenAPI 3.1 REST Specification',
    filename: 'bytebank-openapi-3.1.json',
    format: 'JSON Spec',
    size: '24 KB',
    desc: 'Full OpenAPI 3.1.0 specification defining all 53 endpoints, request schemas, Zod validation models, and HTTP response codes.',
    url: '/api/download/openapi',
    icon: Code,
    color: 'text-[#0B4FFF]',
    bgColor: 'bg-[#F3F7FF]',
  },
];

export default function DownloadPage() {
  return (
    <div className="w-full bg-white text-[#2B2F4A] min-h-screen">
      <section className="relative w-full pt-20 pb-16 bg-[#F3F7FF] text-center overflow-hidden">
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[350px] hero-blob-gradient rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8ECF6] text-xs font-semibold text-[#0B4FFF] shadow-sm">
            <span>Download Center &amp; Open Artifacts</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
            DOWNLOAD DATA PACK
          </h1>

          <p className="mt-3 text-base text-[#6B7090] max-w-2xl mx-auto leading-relaxed">
            Download verifiable database schema files, synthetic customer data, and API contracts directly from the platform.
          </p>
        </div>

        <WaveDivider fill="#FFFFFF" direction="down" className="absolute bottom-0 left-0 w-full" />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DOWNLOADS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.filename}
                className="rounded-2xl bg-white border border-[#E8ECF6] hover:border-[#0B4FFF]/40 p-8 flex flex-col justify-between transition-all group shadow-card-white"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${item.bgColor} border border-[#E8ECF6] flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#F3F7FF] text-[#6B7090] border border-[#E8ECF6]">
                      {item.size}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-mono text-[#0B4FFF] uppercase tracking-wider">
                      {item.format}
                    </span>
                    <h2 className="text-lg font-bold text-[#1B0B5C] mt-1">
                      {item.title}
                    </h2>
                  </div>

                  <p className="text-xs text-[#6B7090] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-8">
                  <a
                    href={item.url}
                    download={item.filename}
                    className="w-full py-3 px-4 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {item.filename}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative bg-[#F3F7FF] py-16 overflow-hidden">
        <WaveDivider fill="#F3F7FF" direction="up" className="absolute top-0 left-0 w-full" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 relative z-10 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B0B5C] uppercase tracking-tight font-sans">
            NEED LIVE DATABASE VERIFICATION?
          </h2>
          <p className="text-sm text-[#6B7090] max-w-xl mx-auto leading-relaxed">
            You can run automated database invariant tests or launch the concurrency race simulator directly against your local PostgreSQL instance.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/lab"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B4FFF] hover:bg-[#0A3FD1] text-white text-xs font-semibold shadow-md transition-all"
            >
              <span>Explore DBMS Concurrency Lab</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
