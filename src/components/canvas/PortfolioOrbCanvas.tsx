'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Html, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface HoldingItem {
  symbol: string;
  name: string;
  quantity: number;
  simulatedValueSru: number;
  type: string;
}

const PASTEL_PALETTE = ['#3B5BFF', '#FFAB2E', '#22D3EE', '#1B0B5C', '#1FD6A0', '#F43F6E'];

function OrbScene({
  holdings,
  onSelectAsset,
}: {
  holdings: HoldingItem[];
  onSelectAsset: (asset: HoldingItem | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.simulatedValueSru, 0) || 1,
    [holdings]
  );

  return (
    <group ref={groupRef}>
      <Sphere args={[0.75, 48, 48]}>
        <meshPhysicalMaterial
          color="#EEF3FF"
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </Sphere>

      {holdings.map((h, i) => {
        const count = Math.max(1, holdings.length);
        const angle = (i / count) * Math.PI * 2;
        const radius = 2.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(i * 1.8) * 0.45;

        const proportion = h.simulatedValueSru / totalValue;
        const size = Math.max(0.24, Math.min(0.55, 0.24 + proportion * 0.65));
        const color = PASTEL_PALETTE[i % PASTEL_PALETTE.length];

        return (
          <Float key={h.symbol} speed={1.8} rotationIntensity={0.2} floatIntensity={0.6}>
            <group position={[x, y, z]}>
              <Sphere
                args={[size, 36, 36]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onSelectAsset(h);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  onSelectAsset(null);
                }}
              >
                <meshPhysicalMaterial
                  color={color}
                  roughness={0.2}
                  metalness={0.15}
                  clearcoat={0.8}
                  clearcoatRoughness={0.15}
                />
              </Sphere>

              <Html
                center
                position={[0, -size - 0.28, 0]}
                distanceFactor={7}
                style={{ pointerEvents: 'none' }}
              >
                <div className="px-2 py-0.5 rounded-full bg-white/95 border border-[#E8ECF6] shadow-xs text-[11px] font-bold text-[#1B0B5C] whitespace-nowrap select-none font-sans">
                  {h.symbol}
                </div>
              </Html>
            </group>
          </Float>
        );
      })}

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.3}
        scale={8}
        blur={2}
        far={3.5}
        color="#1B0B5C"
      />
    </group>
  );
}

export default function PortfolioOrbCanvas({ holdings }: { holdings: HoldingItem[] }) {
  const [hovered, setHovered] = useState<HoldingItem | null>(null);

  const totalValue = useMemo(
    () => holdings?.reduce((sum, h) => sum + (h.simulatedValueSru || 0), 0) || 1,
    [holdings]
  );

  if (!holdings || holdings.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-[#6B7090] text-sm font-medium bg-white rounded-2xl border border-[#E8ECF6]">
        No asset holdings to visualize.
      </div>
    );
  }

  const hoveredPct = hovered
    ? (((hovered.simulatedValueSru || 0) / totalValue) * 100).toFixed(1)
    : '0';

  return (
    <div className="w-full h-80 sm:h-92 relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#F3F7FF] via-[#FFFFFF] to-[#EAF1FF] border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)]">
      <Canvas
        camera={{ position: [0, 1.2, 5.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} color="#FFFFFF" />
        <directionalLight position={[-6, -4, -4]} intensity={0.5} color="#CFF6FF" />
        <pointLight position={[0, 4, 2]} intensity={0.8} color="#E9D8FF" />

        <OrbScene holdings={holdings} onSelectAsset={setHovered} />

        <OrbitControls
          enablePan={false}
          minDistance={3.8}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
          autoRotate={!hovered}
          autoRotateSpeed={0.6}
        />
      </Canvas>

      <div className="absolute top-4 left-4 z-10 max-w-xs pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#E8ECF6] shadow-[0_8px_24px_rgba(27,11,92,0.08)] text-xs transition-all">
          {hovered ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1B0B5C]">
                <span>{hovered.name}</span>
                <span className="font-mono text-[11px] text-[#0B4FFF]">({hovered.symbol})</span>
              </div>
              <div className="text-[11px] text-[#6B7090] flex items-center gap-2">
                <span className="font-mono font-medium text-[#2B2F4A]">{hovered.quantity} units</span>
                <span>&bull;</span>
                <span className="font-mono font-bold text-[#0B4FFF]">
                  {hovered.simulatedValueSru?.toLocaleString()} SRU
                </span>
                <span>&bull;</span>
                <span className="font-bold text-[#0E9F73]">{hoveredPct}%</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#6B7090] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0B4FFF] animate-pulse" />
              <span>Hover or rotate an asset sphere to inspect allocation</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
