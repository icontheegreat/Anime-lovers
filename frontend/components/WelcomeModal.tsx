"use client";

import React, { useState } from "react";
import { SlideToDetonate } from "./ui/slide-to-detonate";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-black/15 bg-white p-6 text-center shadow-2xl dark:border-white/15 dark:bg-black">
        <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
          Welcome to Icon's Anime World
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          unlock the feed.
        </p>

        <div className="mt-8 flex justify-center">
          <SlideToDetonate
            onConfirm={() => {
              setTimeout(() => setIsOpen(false), 400);
            }}
          >
            Slide to unlock
          </SlideToDetonate>
        </div>
      </div>
    </div>
  );
}