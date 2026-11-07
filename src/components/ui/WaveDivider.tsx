import React from 'react';

interface WaveDividerProps {
  fill?: string;
  direction?: 'down' | 'up';
  className?: string;
}

export default function WaveDivider({
  fill = '#F3F7FF',
  direction = 'down',
  className = '',
}: WaveDividerProps) {
  return (
    <div className={`w-full overflow-hidden leading-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1440 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-12 sm:h-16 md:h-20 block ${direction === 'up' ? 'rotate-180' : ''}`}
        preserveAspectRatio="none"
      >
        <path
          d="M0,32 C320,80 480,10 720,44 C960,78 1120,20 1440,56 L1440,96 L0,96 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

