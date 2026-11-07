'use client';

import React from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

interface HeroBarChartProps {
  monthlyData?: { month: string; count: number; isHighlighted?: boolean }[];
}

export default function HeroBarChart({ monthlyData }: HeroBarChartProps) {
  const data = monthlyData && monthlyData.length > 0 ? monthlyData : [
    { month: 'Mar', count: 98, isHighlighted: false },
    { month: 'Apr', count: 124, isHighlighted: false },
    { month: 'May', count: 156, isHighlighted: false },
    { month: 'Jun', count: 182, isHighlighted: false },
    { month: 'Jul', count: 215, isHighlighted: false },
    { month: 'Aug', count: 260, isHighlighted: true },
  ];

  return (
    <div className="w-full bg-[#3B5BFF] rounded-2xl shadow-card-elevated p-6 text-white relative">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
          Monthly Ledger Postings
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
          Active
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="month"
              stroke="#BFDBFE"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={entry.isHighlighted ? '#FFAB2E' : '#FFFFFF'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

