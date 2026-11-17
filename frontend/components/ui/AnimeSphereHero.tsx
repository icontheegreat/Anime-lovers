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

const CARD_COUNT = 220;
const GRID_COLS = 16;

const ANILIST_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        title {
          english
          romaji
        }
        coverImage {
          large
        }
      }
    }
  }
`;

async function fetchGlobalAnimeCatalog(): Promise<PopularAnime[]> {
  try {
    const pages = [1, 2, 3, 4, 5]; // 5 * 50 = 250 unique anime covers
    const responses = await Promise.all(
      pages.map((page) =>
        fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: ANILIST_QUERY,
            variables: { page, perPage: 50 },
          }),
        }).then((res) => (res.ok ? res.json() : null))
      )
    );

    const items: PopularAnime[] = [];
    const seen = new Set<string>();

    for (const res of responses) {
      const media = res?.data?.Page?.media ?? [];
      for (const m of media) {
        const name = m?.title?.english || m?.title?.romaji;
        const image = m?.coverImage?.large;
        if (name && image && !seen.has(name)) {
          seen.add(name);
          items.push({ name, image });
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

function buildSphereCards(
  communityAnime: PopularAnime[] = [],
  globalAnime: PopularAnime[] = []
): PopularAnime[] {
  const combined: PopularAnime[] = [];
  const seen = new Set<string>();

  for (const item of [...communityAnime, ...globalAnime]) {
    if (item.image && !seen.has(item.image)) {
      seen.add(item.image);
      combined.push(item);
    }
  }

  if (combined.length === 0) return [];

  const dataset: PopularAnime[] = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    // Spread across the entire catalog without repeating adjacent tiles
    const idx = i % combined.length;
    dataset.push(combined[idx]);
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
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const arcLift = Math.sin(eased * Math.PI) * 2.6;

    tempPos.lerpVectors(groundPos, spherePos, eased);
    tempPos.y += arcLift;
    meshRef.current.position.copy(tempPos);

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
      <planeGeometry args={[1.1, 1.58]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isPortrait = size.width < size.height;
    camera.position.set(0, 0.5, isPortrait ? 26 : 19.5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

function SceneContent({
  cards,
  progressRef,
  onSelectAnime,
  onSkip,
}: {
  cards: PopularAnime[];
  progressRef: React.MutableRefObject<number>;
  onSelectAnime?: (name: string) => void;
  onSkip: () => void;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((_, delta) => {
    const p = progressRef.current;
    if (globeGroupRef.current) {
      const spinSpeed = 0.08 + p * 0.14;
      globeGroupRef.current.rotation.y += delta * spinSpeed;
    }
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material;
      mat.transparent = true;
      mat.opacity = Math.max(0, 1 - p * 1.6);
    }
  });

  const spatialData = useMemo(() => {
    const count = cards.length;
    const sphereRadius = 7.6;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const rows = Math.ceil(count / GRID_COLS);

    const dummy = new THREE.Object3D();
    const groundQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, 0)
    );

    return cards.map((_, i) => {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const groundX = (col - (GRID_COLS - 1) / 2) * 1.4;
      const groundY = -4.2;
      const groundZ = (row - (rows - 1) / 2) * 1.85;
      const groundPos = new THREE.Vector3(groundX, groundY, groundZ);

      const y = 1 - (i / (count - 1 || 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const spherePos = new THREE.Vector3(
        Math.cos(theta) * r * sphereRadius,
        y * sphereRadius,
        Math.sin(theta) * r * sphereRadius
      );

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

  if (cards.length === 0) return null;

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
            image={cards[idx].image!}
            onSelect={() => {
              if (onSelectAnime) {
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
  const progressRef = useRef(0.55);
  const [globalCatalog, setGlobalCatalog] = useState<PopularAnime[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let active = true;
    fetchGlobalAnimeCatalog().then((catalog) => {
      if (active && catalog.length > 0) {
        setGlobalCatalog(catalog);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    progressRef.current = 0.55;

    return scrollYProgress.on("change", (v) => {
      progressRef.current = Math.min(1, 0.55 + v * 0.45);
    });
  }, [scrollYProgress]);

  const cards = useMemo(
    () => buildSphereCards(animeList, globalCatalog),
    [animeList, globalCatalog]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-[160vh] w-full bg-neutral-950"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute right-6 bottom-8 z-30">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-white/20 bg-neutral-900/85 px-5 py-2.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md transition hover:bg-white hover:text-black"
          >
            Skip to Feed ↓
          </button>
        </div>

        <Canvas dpr={[1, 2]} camera={{ position: [0, 0.5, 22], fov: 48 }}>
          <color attach="background" args={["#0a0a0a"]} />
          <ambientLight intensity={1.8} />
          <React.Suspense fallback={null}>
            <SceneContent
              cards={cards}
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