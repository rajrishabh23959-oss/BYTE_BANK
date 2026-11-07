'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';

interface TransferCoinProps {
  status: 'idle' | 'pending' | 'success' | 'failed';
  senderAccountNo: string;
  receiverAccountNo: string;
  assetSymbol: string;
}

function TransferScene({ status, senderAccountNo, receiverAccountNo, assetSymbol }: TransferCoinProps) {
  const coinRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    if (coinRef.current) {
      if (status === 'pending') {
        progressRef.current = (progressRef.current + delta * 0.8) % 1;

        const t = progressRef.current;
        const x = THREE.MathUtils.lerp(-2.2, 2.2, t);
        const y = Math.sin(t * Math.PI) * 1.1;
        coinRef.current.position.set(x, y, 0);
        coinRef.current.rotation.y += delta * 4;
      } else if (status === 'success') {
        coinRef.current.position.set(2.2, 0, 0);
        coinRef.current.rotation.y += delta * 1.5;
      } else if (status === 'failed') {
        coinRef.current.position.set(0, -0.6, 0);
      } else {
        coinRef.current.position.set(-2.2, 0, 0);
      }
    }
  });

  const coinColor =
    status === 'success'
      ? '#1FD6A0'
      : status === 'failed'
      ? '#F43F6E'
      : status === 'pending'
      ? '#0B4FFF'
      : '#FFAB2E';

  return (
    <group>
      <group position={[-2.2, 0, 0]}>
        <Sphere args={[0.55, 36, 36]}>
          <meshPhysicalMaterial
            color="#0B4FFF"
            roughness={0.2}
            metalness={0.15}
            clearcoat={0.8}
          />
        </Sphere>
        <Html center position={[0, -0.85, 0]}>
          <div className="px-2.5 py-0.5 rounded-full bg-white/95 border border-[#E8ECF6] shadow-xs text-[10px] font-mono font-bold text-[#1B0B5C] whitespace-nowrap">
            {senderAccountNo || 'Sender'}
          </div>
        </Html>
      </group>

      <group position={[2.2, 0, 0]}>
        <Sphere args={[0.55, 36, 36]}>
          <meshPhysicalMaterial
            color={status === 'success' ? '#1FD6A0' : '#8B5CF6'}
            roughness={0.2}
            metalness={0.15}
            clearcoat={0.8}
          />
        </Sphere>
        <Html center position={[0, -0.85, 0]}>
          <div className="px-2.5 py-0.5 rounded-full bg-white/95 border border-[#E8ECF6] shadow-xs text-[10px] font-mono font-bold text-[#1B0B5C] whitespace-nowrap">
            {receiverAccountNo || 'Recipient'}
          </div>
        </Html>
      </group>

      <group ref={coinRef} position={[-2.2, 0, 0]}>
        <Cylinder args={[0.38, 0.38, 0.1, 28]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial
            color={coinColor}
            metalness={0.4}
            roughness={0.15}
            clearcoat={0.9}
          />
        </Cylinder>
        <Html center position={[0, 0, 0.12]}>
          <div className="text-[10px] font-mono font-bold text-white select-none pointer-events-none">
            {assetSymbol}
          </div>
        </Html>
      </group>
    </group>
  );
}

export default function TransferCoinCanvas(props: TransferCoinProps) {
  return (
    <div className="w-full h-44 relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#F3F7FF] via-white to-[#EAF1FF] border border-[#E8ECF6] shadow-[0_8px_30px_rgba(27,11,92,0.08)]">
      <Canvas camera={{ position: [0, 0, 4.6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 4]} intensity={1.5} color="#FFFFFF" />
        <pointLight position={[-4, -3, -2]} intensity={0.6} color="#0B4FFF" />
        <TransferScene {...props} />
      </Canvas>
    </div>
  );
}
