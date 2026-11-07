'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const TREND_DATA = [
  { val1: 40, val2: 24 },
  { val1: 52, val2: 30 },
  { val1: 45, val2: 28 },
  { val1: 68, val2: 44 },
  { val1: 60, val2: 38 },
  { val1: 75, val2: 52 },
  { val1: 70, val2: 48 },
  { val1: 85, val2: 60 },
  { val1: 80, val2: 55 },
  { val1: 95, val2: 70 },
];

export default function MiniTrendChart() {
  return (
    <div className="w-full h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={TREND_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B5BFF" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3B5BFF" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="trendGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1FD6A0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#1FD6A0" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="val1"
            stroke="#3B5BFF"
            strokeWidth={2}
            fill="url(#trendGrad1)"
          />
          <Area
            type="monotone"
            dataKey="val2"
            stroke="#1FD6A0"
            strokeWidth={1.5}
            fill="url(#trendGrad2)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

