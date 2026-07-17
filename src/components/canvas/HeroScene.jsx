import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// A complex abstract geometric object
function AbstractGeometry() {
  const meshRef = useRef();
  const wireframeRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= delta * 0.05;
      wireframeRef.current.rotation.y -= delta * 0.08;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2, 0]} />
          <meshPhysicalMaterial 
            color="#111111" 
            metalness={0.9} 
            roughness={0.1} 
            clearcoat={1} 
            clearcoatRoughness={0.1} 
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1}>
        <mesh ref={wireframeRef} scale={1.2}>
          <dodecahedronGeometry args={[2.2, 1]} />
          <MeshDistortMaterial 
            color="#d4af37" 
            wireframe 
            emissive="#d4af37" 
            emissiveIntensity={0.5} 
            distort={0.2} 
            speed={2} 
          />
        </mesh>
      </Float>
    </group>
  );
}

// Background floating particles
function Particles() {
  const particlesRef = useRef();
  
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
  });

  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  for(let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={particleCount} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial color="#d4af37" size={0.05} transparent opacity={0.6} />
    </points>
  );
}

export default function HeroScene() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#d4af37" />
      
      <Environment preset="city" />

      <AbstractGeometry />
      <Particles />

      <fog attach="fog" args={['#0a0a0a', 5, 15]} />
    </Canvas>
  );
}
