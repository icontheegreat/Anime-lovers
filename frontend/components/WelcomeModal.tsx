'use client';

import { useEffect, useState } from 'react';

export default function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShow(true);
    }
  }, []);

  const handleContinue = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/15 bg-white p-6 text-black shadow-2xl dark:border-white/15 dark:bg-neutral-900 dark:text-white text-center">
        
        {/* Brand Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-neutral-100 text-xl font-bold dark:border-white/15 dark:bg-neutral-800">
          🎬
        </div>

        <h2 className="text-2xl font-semibold">
          Welcome to Anime by Icon
        </h2>

        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Discover what fans are talking about, share your favorite moments, and explore the community.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-85 dark:bg-white dark:text-black cursor-pointer"
        >
         Continue to site
        </button>

      </div>
    </div>
  );
}