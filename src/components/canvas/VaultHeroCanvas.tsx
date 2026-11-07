'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Cylinder, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';

function VaultModel({ mousePos }: { mousePos: { x: number; y: number } }) {
  const vaultRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (vaultRef.current) {

      vaultRef.current.rotation.y = THREE.MathUtils.lerp(
        vaultRef.current.rotation.y,
        mousePos.x * 0.4 + state.clock.getElapsedTime() * 0.1,
        0.05
      );
      vaultRef.current.rotation.x = THREE.MathUtils.lerp(
        vaultRef.current.rotation.x,
        -mousePos.y * 0.3,
        0.05
      );
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.25;
    if (coreRef.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
      coreRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={vaultRef}>

      <Sphere ref={coreRef} args={[1.2, 32, 32]}>
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      <Torus ref={ring1Ref} args={[2.0, 0.08, 16, 100]}>
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} metalness={0.9} />
      </Torus>
      <Torus ref={ring2Ref} args={[2.5, 0.05, 16, 100]}>
        <meshStandardMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={0.6} metalness={0.9} />
      </Torus>

      <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>

        <group position={[2.8, 1.2, 0]}>
          <Cylinder args={[0.5, 0.5, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.8} metalness={0.9} />
          </Cylinder>
          <Text position={[0, 0, 0.08]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
            ₿
          </Text>
        </group>

        <group position={[-2.6, 1.5, 0.5]}>
          <Cylinder args={[0.45, 0.45, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} metalness={0.9} />
          </Cylinder>
          <Text position={[0, 0, 0.08]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="middle">
            Ξ
          </Text>
        </group>

        <group position={[1.8, -2.2, 0.8]}>
          <Cylinder args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.8} metalness={0.9} />
          </Cylinder>
          <Text position={[0, 0, 0.08]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
            SOL
          </Text>
        </group>

        <group position={[-2.2, -1.8, -0.5]}>
          <Cylinder args={[0.4, 0.4, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} metalness={0.9} />
          </Cylinder>
          <Text position={[0, 0, 0.08]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
            STK
          </Text>
        </group>
      </Float>
    </group>
  );
}

export default function VaultHeroCanvas() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hasWebGL) {

    return (
      <div className="w-full h-[450px] flex items-center justify-center relative">
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-600/40 via-blue-500/20 to-purple-600/40 blur-2xl animate-pulse-slow" />
        <div className="absolute w-48 h-48 rounded-full border-2 border-cyan-400/40 flex items-center justify-center shadow-glow">
          <div className="w-32 h-32 rounded-full border border-violet-400/50 flex items-center justify-center">
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">
              BYTEBANK
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[480px] relative">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#a855f7" />
        <Stars radius={50} depth={50} count={1200} factor={3} saturation={0.5} fade speed={1.2} />
        <VaultModel mousePos={mousePos} />
      </Canvas>
    </div>
  );
}
