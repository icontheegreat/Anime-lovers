'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);

  function toggleTheme() {
    const nextDark = !dark;

    setDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  return (
    <header className="top-header">
      <Link href="/" className="site-logo">
        IconLoves Anime
      </Link>

      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label="Toggle theme"
      >
        {dark ? 'White' : 'Dark'}
      </button>
    </header>
  );
}