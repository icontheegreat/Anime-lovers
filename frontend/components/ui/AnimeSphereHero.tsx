"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, ThreeElements } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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

const CARD_COUNT = 160;
const GRID_COLS = 16;
const MAX_UNIQUE_TEXTURES = 48;

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

function createFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 128, 180);
    grad.addColorStop(0, "#1f1f23");
    grad.addColorStop(1, "#09090b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 180);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(4, 4, 120, 172);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

async function fetchGlobalAnimeCatalog(): Promise<PopularAnime[]> {
  try {
    const pages = [1, 2]; // 100 top anime covers (keeps WebGL texture memory safe on mobile)
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
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
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

function buildUniquePool(
  communityAnime: PopularAnime[] = [],
  globalAnime: PopularAnime[] = []
): PopularAnime[] {
  const combined: PopularAnime[] = [];
  const seen = new Set<string>();

  for (const item of [...communityAnime, ...globalAnime]) {
    if (item.image && !seen.has(item.image)) {
      seen.add(item.image);
      combined.push(item);
      if (combined.length >= MAX_UNIQUE_TEXTURES) break;
    }
  }

  return combined;
}

class CanvasErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function CardMesh({
  groundPos,
  spherePos,
  sphereQuat,
  groundQuat,
  progressRef,
  index,
  total,
  texture,
  onSelect,
}: {
  groundPos: THREE.Vector3;
  spherePos: THREE.Vector3;
  sphereQuat: THREE.Quaternion;
  groundQuat: THREE.Quaternion;
  progressRef: React.MutableRefObject<number>;
  index: number;
  total: number;
  texture: THREE.Texture;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

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
  pool,
  progressRef,
  onSelectAnime,
  onSkip,
}: {
  pool: PopularAnime[];
  progressRef: React.MutableRefObject<number>;
  onSelectAnime?: (name: string) => void;
  onSkip: () => void;
}) {
  const globeGroupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.GridHelper>(null);
  const fallbackTexture = useMemo(() => createFallbackTexture(), []);
  const [textures, setTextures] = useState<THREE.Texture[]>([]);

  // Safely load textures with CORS handling and per-image fallback so 1 bad URL never crashes the app
  useEffect(() => {
    if (pool.length === 0) {
      setTextures([]);
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const loadedList: THREE.Texture[] = new Array(pool.length).fill(
      fallbackTexture
    );
    setTextures([...loadedList]);

    pool.forEach((item, idx) => {
      if (!item.image) return;

      loader.load(
        item.image,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          loadedList[idx] = tex;
          setTextures([...loadedList]);
        },
        undefined,
        () => {
          // Keep fallbackTexture on error; never throw unhandled rejection
        }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [pool, fallbackTexture]);

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
    const sphereRadius = 7.6;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const rows = Math.ceil(CARD_COUNT / GRID_COLS);

    const dummy = new THREE.Object3D();
    const groundQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, 0)
    );

    return Array.from({ length: CARD_COUNT }, (_, i) => {
      const row = Math.floor(i / GRID_COLS);
      const col = i % GRID_COLS;
      const groundX = (col - (GRID_COLS - 1) / 2) * 1.4;
      const groundY = -4.2;
      const groundZ = (row - (rows - 1) / 2) * 1.85;
      const groundPos = new THREE.Vector3(groundX, groundY, groundZ);

      const y = 1 - (i / (CARD_COUNT - 1)) * 2;
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
  }, []);

  if (pool.length === 0) return null;

  return (
    <>
      <ResponsiveCamera />
      <group ref={globeGroupRef}>
        <gridHelper
          ref={gridRef}
          args={[36, 24, "#ef4444", "#262626"]}
          position={[0, -4.3, 0]}
        />

        {spatialData.map((data, idx) => {
          const row = Math.floor(idx / GRID_COLS);
          const col = idx % GRID_COLS;
          const poolIdx = (col * 3 + row * 7) % pool.length;
          const anime = pool[poolIdx];
          const tex = textures[poolIdx] || fallbackTexture;

          return (
            <CardMesh
              key={idx}
              index={idx}
              total={CARD_COUNT}
              groundPos={data.groundPos}
              spherePos={data.spherePos}
              groundQuat={data.groundQuat}
              sphereQuat={data.sphereQuat}
              progressRef={progressRef}
              texture={tex}
              onSelect={() => {
                if (onSelectAnime && anime?.name) {
                  onSelectAnime(anime.name);
                }
                onSkip();
              }}
            />
          );
        })}
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
  const [mounted, setMounted] = useState(false);
  const [globalCatalog, setGlobalCatalog] = useState<PopularAnime[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    setMounted(true);
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

  const pool = useMemo(
    () => buildUniquePool(animeList, globalCatalog),
    [animeList, globalCatalog]
  );

  if (!mounted) {
    return <div className="h-screen w-full bg-neutral-950" />;
  }

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

        <CanvasErrorBoundary
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-sm text-neutral-400">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-white/20 px-5 py-2.5 text-white"
              >
                Continue to Discover ↓
              </button>
            </div>
          }
        >
          <Canvas dpr={[1, 2]} camera={{ position: [0, 0.5, 22], fov: 48 }}>
            <color attach="background" args={["#0a0a0a"]} />
            <ambientLight intensity={1.8} />
            <SceneContent
              pool={pool}
              progressRef={progressRef}
              onSelectAnime={onSelectAnime}
              onSkip={onSkip}
            />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.65}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>
    </div>
  );
}