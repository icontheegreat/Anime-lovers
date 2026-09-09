'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
} from 'react';

type SortOption =
  | 'alphabetical'
  | 'recent'
  | 'relevant';

export default function Header() {
  const [dark, setDark] = useState(false);

  const [sortOpen, setSortOpen] =
    useState(false);

  const [sortOption, setSortOption] =
    useState<SortOption>('recent');

  const sortMenuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem('theme');

    const isDark =
      savedTheme === 'dark';

    setDark(isDark);

    document.documentElement.classList.toggle(
      'dark',
      isDark
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setSortOpen(false);
      }
    }

    if (sortOpen) {
      document.addEventListener(
        'mousedown',
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [sortOpen]);

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

  function selectSort(
    option: SortOption
  ) {
    setSortOption(option);
    setSortOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        'feed-sort-change',
        {
          detail: option,
        }
      )
    );
  }

  const currentSortLabel =
    sortOption === 'alphabetical'
      ? 'Alphabetical'
      : sortOption === 'recent'
        ? 'Recently Posted'
        : 'Most Relevant';

  return (
    <header className="top-header">
      <Link
        href="/"
        className="site-logo"
      >
     Anime
      </Link>

      <div className="flex items-center gap-2">
        {/* SORTING */}

        <div
          ref={sortMenuRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setSortOpen(
                (open) => !open
              )
            }
            className="theme-toggle"
            aria-label="Feed sorting options"
            aria-expanded={sortOpen}
            title="Feed sorting options"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 3.5H18C18.5523 3.5 19 3.94772 19 4.5V20L12 16L5 20V4.5C5 3.94772 5.44772 3.5 6 3.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-black bg-white text-black shadow-xl dark:border-white dark:bg-black dark:text-white">
              <div className="border-b border-black px-4 py-3 dark:border-white">
                <p className="text-xs font-medium uppercase tracking-wide text-black dark:text-white">
                  Sort feed
                </p>

                <p className="mt-1 text-sm text-black dark:text-white">
                  {currentSortLabel}
                </p>
              </div>

              <div className="p-1.5">
                {/* ALPHABETICAL */}
                <button
                  type="button"
                  onClick={() =>
                    selectSort('alphabetical')
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    sortOption === 'alphabetical'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black'
                  }`}
                >
                  <span>
                    Alphabetical
                  </span>

                  {sortOption === 'alphabetical' && (
                    <span>✓</span>
                  )}
                </button>

                {/* RECENTLY POSTED */}
                <button
                  type="button"
                  onClick={() =>
                    selectSort('recent')
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    sortOption === 'recent'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black'
                  }`}
                >
                  <span>
                    Recently Posted
                  </span>

                  {sortOption === 'recent' && (
                    <span>✓</span>
                  )}
                </button>

                {/* MOST RELEVANT */}
                <button
                  type="button"
                  onClick={() =>
                    selectSort('relevant')
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    sortOption === 'relevant'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black'
                  }`}
                >
                  <span>
                    Most Relevant
                  </span>

                  {sortOption === 'relevant' && (
                    <span>✓</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* THEME */}

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
      </div>
    </header>
  );
}