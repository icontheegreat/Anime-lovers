"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LiveOrb({ className = "" }: { className?: string }) {
  // Track normalized cursor offsets (-1 to +1)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Calculate cursor position relative to window center
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth) * 2 - 1;
      const y = (event.clientY / innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Limit pupil movement distance in pixels
  const eyeOffsetX = mousePos.x * 3.5;
  const eyeOffsetY = mousePos.y * 3.5;

  return (
    <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
      {/* Outer Pulse Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-pink-500/20 dark:bg-cyan-400/20 blur-sm"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Mascot Body */}
      <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-black dark:bg-white border border-neutral-700 dark:border-neutral-200 shadow-md">
        
        {/* TWO EYES CONTAINER */}
        <div className="flex items-center gap-1.5 z-10">
          
          {/* Left Eye */}
          <div className="relative flex items-center justify-center w-2 h-2.5 rounded-full bg-white dark:bg-black overflow-hidden">
            <motion.div
              className="w-1 h-1 rounded-full bg-black dark:bg-white"
              animate={{
                x: eyeOffsetX,
                y: eyeOffsetY,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </div>

          {/* Right Eye */}
          <div className="relative flex items-center justify-center w-2 h-2.5 rounded-full bg-white dark:bg-black overflow-hidden">
            <motion.div
              className="w-1 h-1 rounded-full bg-black dark:bg-white"
              animate={{
                x: eyeOffsetX,
                y: eyeOffsetY,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </div>

        </div>

      </div>
    </div>
  );
}