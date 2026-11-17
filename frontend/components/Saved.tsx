'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Post } from '../types';

export default function Saved() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api('/posts/saved')
      .then((data) => {
        if (active) {
          setPosts(data.posts ?? []);
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err?.message || 'Unable to load saved posts.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleUnsave(postId: string) {
    if (removingId) return;
    setRemovingId(postId);

    try {
      await api(`/posts/${postId}/save`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((item) => item._id !== postId));
    } catch (err: any) {
      alert(err?.message || 'Unable to remove saved post.');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-64 animate-pulse rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-black/10 p-6 text-sm text-neutral-600 dark:border-white/10 dark:text-neutral-400">
        {error}
      </p>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-black/10 p-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
        You haven&apos;t saved any posts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <div
          key={post._id}
          className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-950"
        >
          <Link
            href={`/post/${post.slug}`}
            className="relative block aspect-[4/3] w-full overflow-hidden bg-black/5 dark:bg-white/5"
          >
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.anime}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <Link
                href={`/post/${post.slug}`}
                className="text-sm font-semibold text-black hover:underline dark:text-white"
              >
                {post.anime}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                {post.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
              <Link
                href={`/post/${post.slug}`}
                className="text-xs font-medium text-black hover:underline dark:text-white"
              >
                View post →
              </Link>

              <button
                type="button"
                disabled={removingId === post._id}
                onClick={() => handleUnsave(post._id)}
                className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-black hover:text-white disabled:opacity-40 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white dark:hover:text-black"
              >
                {removingId === post._id ? 'Removing…' : 'Unsave'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}