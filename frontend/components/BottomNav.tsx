'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '../lib/api';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    api('/auth/me')
      .then((data) => {
        setMe(data.author);
      })
      .catch(() => {
        setMe(null);
      });
  }, []);

  function handleProfile() {
    if (me) {
      router.push('/profile');
    } else {
      router.push('/auth/login');
    }
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bottom-nav">
      <Link
        href="/"
        className={
          isActive('/')
            ? 'bottom-nav-item active'
            : 'bottom-nav-item'
        }
      >
        <span>Home</span>
      </Link>

      <Link
        href="/discover"
        className={
          isActive('/discover')
            ? 'bottom-nav-item active'
            : 'bottom-nav-item'
        }
      >
        <span>Discover</span>
      </Link>

      <Link
        href="/dashboard"
        className={
          isActive('/dashboard')
            ? 'bottom-nav-item active'
            : 'bottom-nav-item'
        }
      >
        <span>Dashboard</span>
      </Link>

      <button
        type="button"
        onClick={handleProfile}
        className={
          pathname === '/profile' ||
          pathname === '/profile/edit'
            ? 'bottom-nav-item active'
            : 'bottom-nav-item'
        }
      >
        <span>Profile</span>
      </button>
    </nav>
  );
}