import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Procedural "smart city" — instanced towers rising from a glowing master-plan grid
function City() {
  const meshRef = useRef();
  const groupRef = useRef();

  const buildings = useMemo(() => {
    const items = [];
    const rng = (seed => () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    })(42);
    for (let x = -11; x <= 11; x++) {
      for (let z = -11; z <= 11; z++) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // central plaza
        if (rng() > 0.62) continue;
        const dist = Math.sqrt(x * x + z * z);
        const h = Math.max(0.25, (rng() * 3.2 + 0.4) * Math.max(0.25, 1.6 - dist * 0.09));
        items.push({
          pos: [x * 1.15 + (rng() - 0.5) * 0.25, h / 2, z * 1.15 + (rng() - 0.5) * 0.25],
          scale: [0.62 + rng() * 0.3, h, 0.62 + rng() * 0.3],
          phase: rng() * Math.PI * 2,
        });
      }
    }
    return items;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
      const targetX = state.pointer.y * 0.06;
      const targetZ = state.pointer.x * 0.06;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -targetZ, 0.05);
    }
    if (meshRef.current) {
      buildings.forEach((b, i) => {
        const grow = 0.94 + Math.sin(t * 0.6 + b.phase) * 0.06;
        dummy.position.set(b.pos[0], (b.scale[1] * grow) / 2, b.pos[2]);
        dummy.scale.set(b.scale[0], b.scale[1] * grow, b.scale[2]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#111a26"
          metalness={0.85}
          roughness={0.35}
          emissive="#1d2b3f"
          emissiveIntensity={0.35}
        />
      </instancedMesh>

      {/* master-plan grid floor */}
      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={1.15}
        cellThickness={0.6}
        cellColor="#233248"
        sectionSize={5.75}
        sectionThickness={1.1}
        sectionColor="#c9a35c"
        fadeDistance={30}
        fadeStrength={2.5}
        infiniteGrid
      />

      {/* golden beacon at the city core */}
      <mesh position={[0, 2.2, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#f0d78c"
          emissive="#c9a35c"
          emissiveIntensity={2.2}
          metalness={1}
          roughness={0.1}
        />
      </mesh>
      <pointLight position={[0, 2.2, 0]} color="#e8c774" intensity={12} distance={10} />

      <Sparkles count={90} scale={[22, 8, 22]} size={2.2} speed={0.25} color="#e8c774" opacity={0.55} />
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 5.5, 13.5], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
    >
      <fog attach="fog" args={['#0a0e14', 12, 30]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} color="#9fb6d9" />
      <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#c9a35c" />
      <Suspense fallback={null}>
        <City />
      </Suspense>
    </Canvas>
  );
}
