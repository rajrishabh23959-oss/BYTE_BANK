import React from 'react';

interface MintDotGridProps {
  cols?: number;
  rows?: number;
  className?: string;
}

export default function MintDotGrid({
  cols = 8,
  rows = 6,
  className = '',
}: MintDotGridProps) {
  const dots = Array.from({ length: cols * rows });

  return (
    <div
      className={`grid gap-2.5 pointer-events-none select-none ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {dots.map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#1FD6A0] inline-block opacity-85"
        />
      ))}
    </div>
  );
}

