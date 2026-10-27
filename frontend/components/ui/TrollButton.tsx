"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export function TrollButton({ onSuccess }: { onSuccess: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [attempts, setAttempts] = useState(0);

  const dodge = () => {
    // Only dodge a few times before letting them finally click it
    if (attempts < 5) {
      const randomX = (Math.random() - 0.5) * 200;
      const randomY = (Math.random() - 0.5) * 120;
      setPosition({ x: randomX, y: randomY });
      setAttempts((prev) => prev + 1);
    }
  };

  return (
    <motion.button
      type="button"
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      onMouseEnter={dodge}
      onTouchStart={dodge}
      onClick={onSuccess}
      className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-pink-500 dark:bg-cyan-500 dark:hover:bg-cyan-400"
    >
      {attempts >= 5 ? "Okay, click me!" : "Click to continue"}
    </motion.button>
  );
}