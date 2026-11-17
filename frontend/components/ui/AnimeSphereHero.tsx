"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, ThreeElements } from "@react-three/fiber";
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
  onSelectAnime?: (animeName: string) => void;
}

const FALLBACK_TEXTURES = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
];

const CARD_COUNT = 180;
const GRID_COLS = 15;

function generateDataset(initialData?: PopularAnime[]): PopularAnime[] {
  const validInitial = (initialData ?? []).filter(
    (item): item is PopularAnime & { image: string } => Boolean(item.image)
  );

  const pool: PopularAnime[] =
    validInitial.length > 0
      ? validInitial
      : FALLBACK_TEXTURES.map((url, idx) => ({
          name: `Featured Anime ${idx + 1}`,
          image: url,
        }));

  const dataset: PopularAnime[] = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    // Offset each row by a prime step so identical posters never stack vertically
    const poolIdx = (col * 3 + row * 7) % pool.length;
    dataset.push(pool[poolIdx]);
  }

  return dataset;
}

function CardMesh({
  groundPos,
  spherePos,
  sphereQuat,
  groundQuat,
  progressRef,
  index,
  total,
  image,
  onSelect,
}: {
  groundPos: THREE.Vector3;
  spherePos: THREE.Vector3;
  sphereQuat: THREE.Quaternion;
  groundQuat: THREE.Quaternion;
  progressRef: React.MutableRefObject<number>;
  index: number;
  total: number;
  image: string;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(image);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
  }, [texture]);

  const staggerOffset = (index / total) * 0.22;
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    const raw = progressRef.current;
    const t = Math.max(
      0,
      Math.min(1, (raw - staggerOffset) / (1 - staggerOffset || 1))
    );
    // Smooth easeInOutCubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const arcLift = Math.sin(eased * Math.PI) * 2.8;

    tempPos.lerpVectors(groundPos, spherePos, eased);
    tempPos.y += arcLift;
    meshRef.current.position.copy(tempPos);

    // Smoothly slerp orientation from flat floor to outward-facing sphere normal
    tempQuat.slerpQuaternions(groundQuat, sphereQuat, eased);
    meshRef.current.quaternion.copy(tempQuat);
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <planeGeometry args={[1.15, 1.65]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isPortrait = size.width < size.height;
    camera.position.set(0, isPortrait ? 1.5 : 1.0, isPortrait ? 27 : 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function SceneContent({
  animeList,
  progressRef,
  onSelectAnime,
  onSkip,
}: {
  animeList?: PopularAnime[];
  progressRef: React.MutableRefObject<number>;
  onSelectAnime?: (name: string) => void;
  onSkip: () => void;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((_, delta) => {
    const p = progressRef.current;
    if (globeGroupRef.current) {
      // Gentle idle spin once assembled into a sphere
      const spinSpeed = 0.06 + p * 0.14;
      globeGroupRef.current.rotation.y += delta * spinSpeed;
    }
    if (gridRef.current) {
      // Fade floor grid out as cards lift into the sphere
      const mat = gridRef.current.material as THREE.Material;
      mat.transparent = true;
      mat.opacity = Math.max(0, 1 - p * 1.6);
    }
  });

  const cards = useMemo(() => generateDataset(animeList), [animeList]);

  const spatialData = useMemo(() => {
    const count = cards.length;
    const sphereRadius = 7.4;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const rows = Math.ceil(count / GRID_COLS);

    const dummy = new THREE.Object3D();
    const groundQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, 0)
    );

    return cards.map((_, i) => {
      // 1. Centered Ground Plane Layout
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const groundX = (col - (GRID_COLS - 1) / 2) * 1.45;
      const groundY = -4.2;
      const groundZ = (row - (rows - 1) / 2) * 1.9;
      const groundPos = new THREE.Vector3(groundX, groundY, groundZ);

      // 2. Fibonacci 3D Sphere Layout
      const y = 1 - (i / (count - 1 || 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const spherePos = new THREE.Vector3(
        Math.cos(theta) * r * sphereRadius,
        y * sphereRadius,
        Math.sin(theta) * r * sphereRadius
      );

      // Compute outward-facing quaternion on the sphere surface
      dummy.position.copy(spherePos);
      dummy.lookAt(spherePos.clone().multiplyScalar(2));
      const sphereQuat = dummy.quaternion.clone();

      return {
        groundPos,
        spherePos,
        groundQuat,
        sphereQuat,
      };
    });
  }, [cards]);

  return (
    <>
      <ResponsiveCamera />
      <group ref={globeGroupRef}>
        <gridHelper
          ref={gridRef}
          args={[36, 24, "#ef4444", "#262626"]}
          position={[0, -4.3, 0]}
        />

        {spatialData.map((data, idx) => (
          <CardMesh
            key={`${idx}-${cards[idx].image}`}
            index={idx}
            total={cards.length}
            groundPos={data.groundPos}
            spherePos={data.spherePos}
            groundQuat={data.groundQuat}
            sphereQuat={data.sphereQuat}
            progressRef={progressRef}
            image={cards[idx].image || FALLBACK_TEXTURES[0]}
            onSelect={() => {
              if (onSelectAnime && !cards[idx].name.startsWith("Featured Anime")) {
                onSelectAnime(cards[idx].name);
              }
              onSkip();
            }}
          />
        ))}
      </group>
    </>
  );
}

export function AnimeSphereHero({
  animeList,
  onSkip,
  onSelectAnime,
}: AnimeSphereHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0.35);
  const [scrollHintVisible, setScrollHintVisible] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    // Start partially assembled (0.35) so the globe silhouette is visible immediately,
    // then complete the full sphere as the user scrolls down
    progressRef.current = 0.35;

    return scrollYProgress.on("change", (v) => {
      progressRef.current = Math.min(1, 0.35 + v * 0.75);
      if (v > 0.15) {
        setScrollHintVisible(false);
      }
    });
  }, [scrollYProgress]);

  return (
    <div
      ref={containerRef}
      className="relative h-[180vh] w-full bg-neutral-950"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Top Hero Overlay to Eliminate Empty Void */}
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center px-5 text-center">
          <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[11px] font-medium uppercase tracking-widest text-neutral-300 backdrop-blur-md">
            Interactive Archive
          </span>
          {/* <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Explore the Anime Sphere
          </h2> */}
          {/* <p className="mt-1.5 max-w-md text-xs text-neutral-400 sm:text-sm">
            Drag to rotate or scroll to assemble the globe. Tap any card to
            explore.
          </p> */}
        </div>

        {/* Bottom Controls */}
        <div className="absolute inset-x-0 bottom-8 z-30 flex items-center justify-between px-6">
          <span
            className={`text-xs text-neutral-400 transition-opacity duration-300 ${
              scrollHintVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Scroll to form globe ↓
          </span>

          <button
            type="button"
            onClick={onSkip}
            className="ml-auto rounded-full border border-white/20 bg-neutral-900/85 px-5 py-2.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md transition hover:bg-white hover:text-black"
          >
            Skip to Feed ↓
          </button>
        </div>

        {/* 3D WebGL Canvas */}
        <Canvas dpr={[1, 2]} camera={{ position: [0, 1.5, 24], fov: 48 }}>
          <color attach="background" args={["#0a0a0a"]} />
          <ambientLight intensity={1.8} />
          <React.Suspense fallback={null}>
            <SceneContent
              animeList={animeList}
              progressRef={progressRef}
              onSelectAnime={onSelectAnime}
              onSkip={onSkip}
            />
          </React.Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.65}
          />
        </Canvas>
      </div>
    </div>
  );
}