"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

export interface SlideToDetonateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  children?: React.ReactNode;
  label?: React.ReactNode;
  onConfirm?: () => void;
  threshold?: number; // 0 to 1
  resistance?: number; // 0 to 1
  smoothness?: number; // 0 to 1
  variant?: "dark" | "light";
  resetAfter?: number; // ms
  disabled?: boolean;
  className?: string;
}

export function SlideToDetonate({
  children,
  label = "Slide to detonate",
  onConfirm,
  threshold = 0.9,
  resistance = 0.35,
  smoothness = 0.4,
  variant = "dark",
  resetAfter = 1600,
  disabled = false,
  className = "",
  ...divProps
}: SlideToDetonateProps) {
  const [detonated, setDetonated] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxDistance, setMaxDistance] = useState(216);
  const isDragging = useRef(false);

  // Measure slider dimensions dynamically
  useEffect(() => {
    if (trackRef.current) {
      const trackWidth = trackRef.current.clientWidth;
      const handleWidth = 48; // 12 * 4px
      const padding = 8; // p-1 * 2
      setMaxDistance(Math.max(100, trackWidth - handleWidth - padding));
    }
  }, []);

  // Raw pointer drag distance (0 to maxDistance)
  const rawX = useMotionValue(0);

  // Calculate resistance curve
  const targetX = useTransform(rawX, (latest) => {
    const progress = latest / maxDistance;
    const resFactor = 1 - progress * Math.min(0.9, resistance);
    return latest * resFactor;
  });

  // Calculate smoothness spring physics
  const springStiffness = smoothness === 0 ? 1000 : Math.max(80, 450 - smoothness * 350);
  const springDamping = smoothness === 0 ? 100 : Math.max(10, 35 - smoothness * 20);

  const springX = useSpring(targetX, {
    stiffness: springStiffness,
    damping: springDamping,
  });

  const activeX = smoothness === 0 ? targetX : springX;

  // Visual cues
  const isLight = variant === "light";
  const glowOpacity = useTransform(rawX, [0, maxDistance], [0.1, 0.95]);

  // Pointer gesture handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || detonated) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || disabled || detonated || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const currentPointerX = e.clientX - rect.left - 24; // Center on handle
    const clampedX = Math.max(0, Math.min(maxDistance, currentPointerX));
    rawX.set(clampedX);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const currentProgress = rawX.get() / maxDistance;

    if (currentProgress >= threshold && !disabled) {
      setDetonated(true);
      onConfirm?.();

      if (resetAfter > 0) {
        setTimeout(() => {
          setDetonated(false);
          rawX.set(0);
        }, resetAfter);
      }
    } else {
      rawX.set(0);
    }
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex h-14 w-full max-w-xs items-center overflow-hidden rounded-full border p-1 select-none touch-none transition-colors ${
        disabled ? "opacity-50 pointer-events-none" : "cursor-grab active:cursor-grabbing"
      } ${
        isLight
          ? "border-neutral-300 bg-neutral-100 text-neutral-900 shadow-inner"
          : "border-red-500/40 bg-neutral-950 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      } ${className}`}
      {...divProps}
    >
      {/* Dynamic Fuse Fill Overlay */}
      <motion.div
        className={`absolute inset-0 rounded-full ${
          isLight
            ? "bg-gradient-to-r from-red-100 via-orange-200 to-red-500"
            : "bg-gradient-to-r from-red-950/40 via-red-900/60 to-red-600"
        }`}
        style={{ opacity: glowOpacity }}
      />

      {/* Label Text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold tracking-widest uppercase">
        {detonated ? (
          <span className={isLight ? "text-red-600 font-extrabold" : "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]"}>
            BOOM! 💥
          </span>
        ) : (
          <span className={isLight ? "text-neutral-600" : "text-neutral-400"}>
            {children || label}
          </span>
        )}
      </div>

      {/* Explosion Effect */}
      <AnimatePresence>
        {detonated && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 blur-sm pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Handle controlled strictly by Spring/Resistance */}
      <motion.div
        style={{ x: activeX }}
        className={`z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-shadow pointer-events-none ${
          isLight
            ? "bg-white text-neutral-900 border border-neutral-200 shadow-neutral-300"
            : "bg-gradient-to-tr from-red-700 via-red-600 to-amber-500 text-white border border-red-300/40 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
        }`}
      >
        <motion.span
          animate={detonated ? { rotate: [0, -20, 20, 0], scale: [1, 1.3, 1] } : {}}
          className="text-lg"
        >
          💣
        </motion.span>
      </motion.div>
    </div>
  );
}