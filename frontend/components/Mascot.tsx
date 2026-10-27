"use client";

import { LiveOrb } from './ui/live-orb';

export function Mascot() {
  return (
    <div className="relative flex items-center justify-center h-8 w-8 md:h-10 md:w-10">
      <LiveOrb />
    </div>
  );
}