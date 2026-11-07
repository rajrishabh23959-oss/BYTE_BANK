'use client';

import React from 'react';

interface RobotAvatarSvgProps {
  className?: string;
  size?: number;
}

export default function RobotAvatarSvg({ className = 'w-full h-full', size }: RobotAvatarSvgProps) {
  const sizeStyle = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="robotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="robotBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A86FF" />
          <stop offset="60%" stopColor="#1E5BFF" />
          <stop offset="100%" stopColor="#0B40D8" />
        </linearGradient>
        <linearGradient id="robotHighlight" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#70A7FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1E5BFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="robotFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0A0E1A" />
          <stop offset="100%" stopColor="#05070D" />
        </linearGradient>
        <linearGradient id="robotFlame" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#15368A" />
          <stop offset="100%" stopColor="#0D225C" />
        </linearGradient>
        <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <circle cx="60" cy="115" r="30" fill="url(#robotGlow)" />

      <path d="M47 114 Q45 128 47 134 Q49 128 51 114 Z" fill="url(#robotFlame)" />
      <path d="M69 114 Q67 128 69 134 Q71 128 73 114 Z" fill="url(#robotFlame)" />

      <rect x="44" y="106" width="10" height="9" rx="3" fill="#15368A" />
      <rect x="66" y="106" width="10" height="9" rx="3" fill="#15368A" />

      <rect x="42" y="112" width="14" height="3" rx="1.5" fill="#00F5FF" />
      <rect x="64" y="112" width="14" height="3" rx="1.5" fill="#00F5FF" />

      <ellipse cx="60" cy="94" rx="18" ry="17" fill="url(#robotBody)" />
      <ellipse cx="60" cy="104" rx="15" ry="4" fill="url(#beltGrad)" />

      <rect x="55" y="90" width="10" height="7" rx="2" fill="#FFFFFF" opacity="0.9" />

      <g transform="matrix(0.96 0.28 -0.28 0.96 42 12)">
        <ellipse cx="6" cy="74" rx="4.5" ry="11" fill="url(#robotBody)" />
        <circle cx="6" cy="85" r="4" fill="url(#robotBody)" />
      </g>
      <g transform="matrix(0.96 -0.28 0.28 0.96 -18 22)">
        <ellipse cx="108" cy="74" rx="4.5" ry="11" fill="url(#robotBody)" />
        <circle cx="108" cy="85" r="4" fill="url(#robotBody)" />
      </g>

      <g>
        <path
          d="M60 12 C60 12 72 28 85 40 C94 48 95 62 88 74 C81 86 69 90 60 90 C51 90 39 86 32 74 C25 62 26 48 35 40 C48 28 60 12 60 12 Z"
          fill="url(#robotBody)"
        />
        <path
          d="M60 15 C60 15 70 29 82 40 C89 47 90 58 84 68 C80 58 75 48 64 36 C55 26 60 15 60 15 Z"
          fill="url(#robotHighlight)"
        />

        <ellipse cx="23" cy="56" rx="6" ry="10" fill="#1E5BFF" />
        <ellipse cx="23" cy="56" rx="4" ry="7" fill="#00F5FF" opacity="0.85" />

        <ellipse cx="97" cy="56" rx="6" ry="10" fill="#1E5BFF" />
        <ellipse cx="97" cy="56" rx="4" ry="7" fill="#00F5FF" opacity="0.85" />

        <ellipse cx="60" cy="57" rx="25" ry="20" fill="url(#robotFace)" />

        <circle cx="49" cy="54" r="5" fill="#FFFFFF" filter="url(#eyeGlow)" />
        <circle cx="71" cy="54" r="5" fill="#FFFFFF" filter="url(#eyeGlow)" />

        <path
          d="M56 63 Q60 67 64 63"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        <path
          d="M74 29 L77 34 L79 34 L77 31 L80 31 L80 29 Z"
          fill="#FFFFFF"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
