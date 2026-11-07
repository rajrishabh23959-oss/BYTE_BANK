'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RobotModelProps {
  isHovered: boolean;
  isMoving: boolean;
  isWaving: boolean;
  headingZ: number;
}

function CuteRobotMesh({ isHovered, isMoving, isWaving, headingZ }: RobotModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const leftFlameRef = useRef<THREE.Mesh>(null);
  const rightFlameRef = useRef<THREE.Mesh>(null);
  const thrusterLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (rootRef.current) {
      const bob = Math.sin(t * 2.8) * 0.035;
      rootRef.current.position.y = -0.08 + bob;

      const targetRotZ = headingZ + Math.sin(t * 1.5) * 0.03;
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, targetRotZ, delta * 4);

      if (isHovered) {
        rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, Math.sin(t * 3) * 0.25, delta * 6);
      } else {
        rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, 0, delta * 3);
      }
    }

    if (headRef.current) {
      const pointerX = state.pointer.x;
      const pointerY = state.pointer.y;
      const targetHeadY = THREE.MathUtils.clamp(pointerX * 0.45, -0.6, 0.6);
      const targetHeadX = THREE.MathUtils.clamp(-pointerY * 0.35, -0.4, 0.4);

      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadY, delta * 5);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadX, delta * 5);
    }

    if (rightArmRef.current) {
      if (isWaving) {
        rightArmRef.current.position.y = 0.08;
        rightArmRef.current.rotation.z = 2.1 + Math.sin(t * 12) * 0.45;
        rightArmRef.current.rotation.x = Math.cos(t * 8) * 0.2;
      } else {
        rightArmRef.current.position.y = -0.04;
        rightArmRef.current.rotation.z = 0.22 - Math.sin(t * 2.8) * 0.12;
        rightArmRef.current.rotation.x = Math.sin(t * 2.8) * 0.08;
      }
    }

    if (leftArmRef.current) {
      leftArmRef.current.position.y = -0.04;
      leftArmRef.current.rotation.z = -0.22 + Math.sin(t * 2.8) * 0.12;
      leftArmRef.current.rotation.x = -Math.sin(t * 2.8) * 0.08;
    }

    const flameBase = isMoving ? 1.4 : 1.0;
    const flameFlicker = flameBase + Math.sin(t * 24) * 0.25;
    if (leftFlameRef.current) leftFlameRef.current.scale.y = flameFlicker;
    if (rightFlameRef.current) rightFlameRef.current.scale.y = flameFlicker;

    if (thrusterLightRef.current) {
      thrusterLightRef.current.intensity = (isMoving ? 2.5 : 1.6) + Math.sin(t * 18) * 0.4;
    }

    if (eyeLeftRef.current && eyeRightRef.current) {
      const isBlinking = t % 3.8 < 0.14;
      const blinkY = isBlinking ? 0.08 : 1.0;
      eyeLeftRef.current.scale.y = blinkY;
      eyeRightRef.current.scale.y = blinkY;
    }
  });

  const blueMaterial = new THREE.MeshPhysicalMaterial({
    color: '#256eff',
    emissive: '#103cb0',
    emissiveIntensity: 0.18,
    roughness: 0.15,
    metalness: 0.12,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });

  const darkBeltMaterial = new THREE.MeshPhysicalMaterial({
    color: '#15368a',
    roughness: 0.3,
    metalness: 0.2,
  });

  const blackGlassFace = new THREE.MeshPhysicalMaterial({
    color: '#05070f',
    roughness: 0.05,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  const whiteGlow = new THREE.MeshBasicMaterial({
    color: '#ffffff',
  });

  const cyanRingGlow = new THREE.MeshStandardMaterial({
    color: '#00f5ff',
    emissive: '#00f5ff',
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const flameMaterial = new THREE.MeshBasicMaterial({
    color: '#00f5ff',
    transparent: true,
    opacity: 0.88,
  });

  return (
    <group ref={rootRef} position={[0, -0.12, 0]} scale={[0.72, 0.72, 0.72]}>
      <group ref={headRef} position={[0, 0.28, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.36, 32, 32]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>

        <mesh position={[0, 0.34, -0.04]} rotation={[-0.12, 0, 0]}>
          <coneGeometry args={[0.22, 0.38, 32]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>

        <mesh position={[0, 0.52, -0.07]}>
          <sphereGeometry args={[0.048, 16, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>

        <mesh position={[0.13, 0.36, 0.18]} rotation={[0.2, 0.3, -0.2]}>
          <torusGeometry args={[0.04, 0.008, 12, 20]} />
          <primitive object={whiteGlow} attach="material" />
        </mesh>

        <mesh position={[0, 0.06, 0.18]} scale={[1.05, 0.88, 0.72]}>
          <sphereGeometry args={[0.27, 32, 24]} />
          <primitive object={blackGlassFace} attach="material" />
        </mesh>

        <mesh ref={eyeLeftRef} position={[-0.095, 0.08, 0.355]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.015, 24]} />
          <primitive object={whiteGlow} attach="material" />
        </mesh>

        <mesh ref={eyeRightRef} position={[0.095, 0.08, 0.355]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.015, 24]} />
          <primitive object={whiteGlow} attach="material" />
        </mesh>

        <mesh position={[0, 0.015, 0.36]} rotation={[0, 0, -Math.PI * 0.88]}>
          <torusGeometry args={[0.026, 0.006, 12, 20, Math.PI * 0.75]} />
          <primitive object={whiteGlow} attach="material" />
        </mesh>

        <group position={[-0.37, 0.07, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.06, 24]} />
            <primitive object={blueMaterial} attach="material" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.085, 0.018, 16, 28]} />
            <primitive object={cyanRingGlow} attach="material" />
          </mesh>
        </group>

        <group position={[0.37, 0.07, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.06, 24]} />
            <primitive object={blueMaterial} attach="material" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.085, 0.018, 16, 28]} />
            <primitive object={cyanRingGlow} attach="material" />
          </mesh>
        </group>
      </group>

      <group position={[0, -0.16, 0]}>
        <mesh scale={[1, 1.05, 0.92]}>
          <sphereGeometry args={[0.22, 28, 24]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>

        <mesh position={[0, 0.02, 0.21]}>
          <boxGeometry args={[0.07, 0.05, 0.01]} />
          <primitive object={whiteGlow} attach="material" />
        </mesh>

        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.17, 0.16, 0.06, 24]} />
          <primitive object={darkBeltMaterial} attach="material" />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.26, -0.13, 0]}>
        <mesh>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.09, 0.02]} rotation={[0.25, 0, -0.15]}>
          <cylinderGeometry args={[0.04, 0.035, 0.13, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[0.01, -0.17, 0.04]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.26, -0.13, 0]}>
        <mesh>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.09, 0.02]} rotation={[0.25, 0, 0.15]}>
          <cylinderGeometry args={[0.04, 0.035, 0.13, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.01, -0.17, 0.04]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
      </group>

      <group position={[-0.1, -0.34, 0]}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.048, 0.042, 0.11, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.042, 0.012, 12, 20]} />
          <primitive object={darkBeltMaterial} attach="material" />
        </mesh>
        <mesh ref={leftFlameRef} position={[0, -0.21, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.052, 0.18, 16]} />
          <primitive object={flameMaterial} attach="material" />
        </mesh>
      </group>

      <group position={[0.1, -0.34, 0]}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.048, 0.042, 0.11, 16]} />
          <primitive object={blueMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.042, 0.012, 12, 20]} />
          <primitive object={darkBeltMaterial} attach="material" />
        </mesh>
        <mesh ref={rightFlameRef} position={[0, -0.21, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.052, 0.18, 16]} />
          <primitive object={flameMaterial} attach="material" />
        </mesh>
      </group>

      <pointLight ref={thrusterLightRef} position={[0, -0.56, 0]} color="#00f5ff" intensity={1.8} distance={1.8} />
    </group>
  );
}

export default function CuteRobotCanvas({
  onClick,
  isMoving = false,
  headingZ = 0,
}: {
  onClick?: () => void;
  isMoving?: boolean;
  headingZ?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [waving, setWaving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleClick = () => {
    setWaving(true);
    setTimeout(() => setWaving(false), 1400);
    onClick?.();
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer relative w-full h-full select-none"
      title="ByteBank 3D Mascot"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0.04, 3.1], fov: 36 }}
        style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
      >
        <ambientLight intensity={1.3} />
        <directionalLight position={[4, 5, 4]} intensity={2.2} color="#ffffff" />
        <directionalLight position={[-4, 2, -2]} intensity={1.4} color="#38bdf8" />
        <directionalLight position={[0, -3, 2]} intensity={0.6} color="#00f5ff" />
        <CuteRobotMesh
          isHovered={hovered}
          isMoving={isMoving}
          isWaving={waving}
          headingZ={headingZ}
        />
      </Canvas>
    </div>
  );
}

