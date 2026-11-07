'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

interface AccountNode {
  id: number;
  label: string;
  isSystem?: boolean;
  status?: string;
  position: [number, number, number];
}

interface TransferEdge {
  from: [number, number, number];
  to: [number, number, number];
  status: 'success' | 'failed' | 'flagged';
}

function GraphScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  const nodes: AccountNode[] = useMemo(() => [
    { id: 1, label: 'TREASURY', isSystem: true, position: [0, 1.2, 0] },
    { id: 2, label: 'MARKET_MAKER', isSystem: true, position: [0, -1.2, 0] },
    { id: 3, label: 'BB-ACC-5001', status: 'active', position: [-2.2, 0.6, 0.8] },
    { id: 4, label: 'BB-ACC-5002', status: 'active', position: [-1.4, -0.8, -1.2] },
    { id: 5, label: 'BB-ACC-5003', status: 'active', position: [2.0, 0.4, 0.6] },
    { id: 6, label: 'BB-ACC-5004', status: 'frozen', position: [1.6, -1.0, -1.0] },
    { id: 7, label: 'BB-ACC-5005', status: 'active', position: [-0.8, 1.8, -0.9] },
    { id: 8, label: 'BB-ACC-5006', status: 'active', position: [1.2, 1.6, 1.0] },
  ], []);

  const edges: TransferEdge[] = useMemo(() => [
    { from: nodes[0].position, to: nodes[2].position, status: 'success' },
    { from: nodes[2].position, to: nodes[4].position, status: 'success' },
    { from: nodes[2].position, to: nodes[3].position, status: 'success' },
    { from: nodes[2].position, to: nodes[6].position, status: 'success' },
    { from: nodes[3].position, to: nodes[4].position, status: 'success' },
    { from: nodes[3].position, to: nodes[6].position, status: 'failed' },
    { from: nodes[2].position, to: nodes[4].position, status: 'success' },
    { from: nodes[5].position, to: nodes[3].position, status: 'flagged' },
  ], [nodes]);

  return (
    <group ref={groupRef}>
      {edges.map((edge, idx) => {
        const color =
          edge.status === 'success'
            ? '#0E9F73'
            : edge.status === 'failed'
            ? '#D6204F'
            : '#FFAB2E';
        return (
          <Line
            key={idx}
            points={[edge.from, edge.to]}
            color={color}
            lineWidth={edge.status === 'failed' ? 2 : 1.5}
            dashed={edge.status === 'failed'}
            dashScale={2}
          />
        );
      })}

      {nodes.map((node) => {
        const nodeColor = node.isSystem
          ? '#FFAB2E'
          : node.status === 'frozen'
          ? '#F43F6E'
          : '#0B4FFF';

        return (
          <group key={node.id} position={node.position}>
            <Sphere args={[node.isSystem ? 0.35 : 0.25, 24, 24]}>
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={0.6}
                roughness={0.2}
                metalness={0.7}
              />
            </Sphere>
            <Html center position={[0, -0.42, 0]} distanceFactor={8} zIndexRange={[100, 0]}>
              <div className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#E8ECF6] shadow-xs text-[10px] font-mono font-bold text-[#1B0B5C] whitespace-nowrap pointer-events-none select-none">
                {node.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function NetworkGraphCanvas() {
  return (
    <div className="w-full h-80 relative rounded-2xl bg-gradient-to-b from-[#F3F7FF] via-white to-[#EAF1FF] border border-[#E8ECF6] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-5, -5, -3]} intensity={1.2} color="#0B4FFF" />
        <GraphScene />
      </Canvas>
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] font-mono text-[#2B2F4A] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#E8ECF6] shadow-xs">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1FD6A0]" /> Success</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F43F6E]" /> Insufficient/Rejected</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FFAB2E]" /> System/Treasury</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0B4FFF]" /> Active Customer</span>
      </div>
    </div>
  );
}
