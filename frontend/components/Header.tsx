'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';

    setDark(isDark);

    document.documentElement.classList.toggle(
      'dark',
      isDark
    );
  }, []);

  function toggleTheme() {
    const nextDark = !dark;

    setDark(nextDark);

    document.documentElement.classList.toggle(
      'dark',
      nextDark
    );

    localStorage.setItem(
      'theme',
      nextDark ? 'dark' : 'light'
    );
  }

  return (
    <header className="top-header">
      <Link
        href="/"
        className="site-logo"
      >
        IconLoves Anime
      </Link>

      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={
          dark
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        }
        aria-pressed={dark}
        title={
          dark
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        }
      >
        <span aria-hidden="true">
          {dark ? '☀' : '◐'}
        </span>

        <span>
          {dark ? 'Light' : 'Dark'}
        </span>
      </button>
    </header>
  );
}