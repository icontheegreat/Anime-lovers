"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { useScroll } from "framer-motion";
import * as THREE from "three";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export type PopularAnime = {
  name: string;
  image: string | null;
};

interface AnimeSphereHeroProps {
  animeList?: PopularAnime[];
  onSkip: () => void;
}

// Reliable direct poster image sources
const POSTER_TEXTURES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=300&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80",
];

function generateDataset(initialData?: PopularAnime[]): PopularAnime[] {
  const dataset: PopularAnime[] = [];
  const baseCount = initialData && initialData.length > 0 ? initialData : [];

  for (let i = 0; i < 450; i++) {
    if (i < baseCount.length && baseCount[i].image) {
      dataset.push(baseCount[i]);
    } else {
      const cover = POSTER_TEXTURES[i % POSTER_TEXTURES.length];
      dataset.push({
        name: `Anime ${i + 1}`,
        image: cover,
      });
    }
  }

  return dataset;
}

function CardMesh({
  groundPos,
  spherePos,
  progressRef,
  index,
  total,
  image,
  onSelect,
}: {
  groundPos: [number, number, number];
  spherePos: [number, number, number];
  progressRef: React.MutableRefObject<number>;
  index: number;
  total: number;
  image: string;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);

  const staggerOffset = (index / total) * 0.25;

  useFrame(() => {
    if (!meshRef.current) return;

    const rawProgress = progressRef.current;
    const adjustedProgress = Math.max(
      0,
      Math.min(1, (rawProgress - staggerOffset) / (1 - staggerOffset || 1))
    );

    const arcHeight = Math.sin(adjustedProgress * Math.PI) * 3.5;

    const currentX =
      (1 - adjustedProgress) * groundPos[0] + adjustedProgress * spherePos[0];
    const currentY =
      (1 - adjustedProgress) * groundPos[1] +
      adjustedProgress * spherePos[1] +
      arcHeight;
    const currentZ =
      (1 - adjustedProgress) * groundPos[2] + adjustedProgress * spherePos[2];

    meshRef.current.position.set(currentX, currentY, currentZ);

    // Tilt flat on floor at 0, face outward on sphere at 1
    const targetRotX = (1 - adjustedProgress) * (-Math.PI / 2);
    meshRef.current.rotation.x = targetRotX;
  });

  return (
    <mesh ref={meshRef} onClick={onSelect}>
      <planeGeometry args={[1.2, 1.8]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SceneContent({
  animeList,
  progressRef,
  onSelect,
}: {
  animeList?: PopularAnime[];
  progressRef: React.MutableRefObject<number>;
  onSelect: () => void;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (globeGroupRef.current && progressRef.current > 0.4) {
      globeGroupRef.current.rotation.y += delta * 0.1 * progressRef.current;
    }
  });

  const cards = useMemo(() => generateDataset(animeList), [animeList]);

  const spatialData = useMemo(() => {
    const count = cards.length;
    const sphereRadius = 10.0;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const cols = 20;

    return cards.map((_, i) => {
      // 1. Ground Plane Layout
      const row = Math.floor(i / cols);
      const col = i % cols;
      const groundX = (col - cols / 2) * 1.6;
      const groundY = -6;
      const groundZ = (row - 10) * 1.6;

      // 2. Fibonacci 3D Sphere Layout
      const y = 1 - (i / (count - 1 || 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const sphereX = Math.cos(theta) * r * sphereRadius;
      const sphereY = y * sphereRadius;
      const sphereZ = Math.sin(theta) * r * sphereRadius;

      return {
        groundPos: [groundX, groundY, groundZ] as [number, number, number],
        spherePos: [sphereX, sphereY, sphereZ] as [number, number, number],
      };
    });
  }, [cards]);

  return (
    <group ref={globeGroupRef}>
      {/* Floor Grid */}
      <gridHelper args={[60, 30, "#ef4444", "#222222"]} position={[0, -6.1, 0]} />

      {spatialData.map((data, idx) => (
        <CardMesh
          key={idx}
          index={idx}
          total={cards.length}
          groundPos={data.groundPos}
          spherePos={data.spherePos}
          progressRef={progressRef}
          image={cards[idx].image || POSTER_TEXTURES[0]}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export function AnimeSphereHero({ animeList, onSkip }: AnimeSphereHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      progressRef.current = v;
    });
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="relative h-[200vh] w-full bg-neutral-950">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Bottom Floating Action Button */}
        <div className="absolute right-6 bottom-8 z-30">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-red-500/40 bg-neutral-900/80 px-6 py-2.5 text-xs font-bold tracking-widest text-white backdrop-blur-md transition-all hover:bg-red-600 hover:text-white"
          >
            Skip to Feed ↓
          </button>
        </div>

        {/* 3D WebGL Canvas */}
        <Canvas camera={{ position: [0, 2, 22], fov: 50 }}>
          <ambientLight intensity={2.0} />
          <pointLight position={[15, 20, 15]} intensity={2.5} color="#ef4444" />
          <React.Suspense fallback={null}>
            <SceneContent
              animeList={animeList}
              progressRef={progressRef}
              onSelect={onSkip}
            />
          </React.Suspense>
          <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.6} />
        </Canvas>
      </div>
    </div>
  );
}