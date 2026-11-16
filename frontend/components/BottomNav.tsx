'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '../lib/api';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  const [me, setMe] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    api('/auth/me')
      .then((data) => {
        setMe(data.author);
      })
      .catch(() => {
        setMe(null);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function handleProfile() {
    setIsOpen(false);
    if (me) {
      router.push('/profile');
    } else {
      router.push('/auth/login');
    }
  }

  const navItems = [
    { label: 'Home', href: '/', active: pathname === '/' },
    { label: 'Discover', href: '/discover', active: pathname === '/discover' },
    { label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
  ];

  const isProfileActive =
    pathname === '/profile' || pathname === '/profile/edit';

  return (
    <div
      ref={navRef}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center"
    >
      <motion.nav
        layout
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        className={`relative flex items-center overflow-hidden border backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] ${
          isOpen
            ? 'h-14 rounded-full border-black/15 bg-white/90 px-2 dark:border-white/20 dark:bg-neutral-950/90'
            : 'h-14 w-14 cursor-pointer rounded-full border-white/25 bg-neutral-950/90 dark:border-white/25 dark:bg-black/90'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!isOpen ? (
            /* COLLAPSED: iOS AssistiveTouch Dark & White Sphere */
            <motion.button
              key="assistive-sphere"
              type="button"
              aria-label="Open navigation"
              onClick={() => setIsOpen(true)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              whileTap={{ scale: 0.9 }}
              className="group relative flex h-full w-full items-center justify-center focus:outline-none"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:scale-105">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30">
                  <span className="h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
                </span>
              </span>
            </motion.button>
          ) : (
            /* EXPANDED: Horizontal Bottom Nav with Sliding Active Pill */
            <motion.div
              key="expanded-nav"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, delay: 0.04 }}
              className="flex items-center gap-1 px-1 sm:gap-2"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm"
                >
                  {item.active && (
                    <motion.span
                      layoutId="activeBottomNavPill"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 35,
                      }}
                      className="absolute inset-0 z-0 rounded-full border border-black/15 bg-black dark:border-white/25 dark:bg-white"
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors ${
                      item.active
                        ? '!text-white dark:!text-black font-semibold'
                        : '!text-neutral-700 hover:!text-black dark:!text-neutral-300 dark:hover:!text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}

              <button
                type="button"
                onClick={handleProfile}
                className="relative rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm"
              >
                {isProfileActive && (
                  <motion.span
                    layoutId="activeBottomNavPill"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 35,
                    }}
                    className="absolute inset-0 z-0 rounded-full border border-black/15 bg-black dark:border-white/25 dark:bg-white"
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    isProfileActive
                      ? '!text-white dark:!text-black font-semibold'
                      : '!text-neutral-700 hover:!text-black dark:!text-neutral-300 dark:hover:!text-white'
                  }`}
                >
                  Profile
                </span>
              </button>

              {/* Collapse dot button */}
              <button
                type="button"
                aria-label="Collapse navigation"
                onClick={() => setIsOpen(false)}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10 !text-neutral-700 transition hover:bg-black/20 dark:bg-white/15 dark:!text-neutral-200 dark:hover:bg-white/25"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}