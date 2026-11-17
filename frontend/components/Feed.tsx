'use client';

import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { api } from '../lib/api';
import { Post, ThreadItem } from '../types';
import DownloadVideoButton from './DownloadVideoButton';
import SavePostButton from './SavePostButton';

const threshold = 110;

type SortOption = 'alphabetical' | 'recent' | 'relevant';

export default function Feed({
  initialPost,
}: {
  initialPost?: Post;
}) {
  const [posts, setPosts] = useState<Post[]>(
    initialPost ? [initialPost] : []
  );
  const [index, setIndex] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialPost);
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialFetchStarted = useRef(false);

  function formatPostTime(dateString: string) {
    const created = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return created.toLocaleDateString();
  }

  const load = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const q = cursor
        ? `?limit=8&cursor=${encodeURIComponent(cursor)}`
        : '?limit=8';

      const data = await api('/posts' + q);

      setPosts((currentPosts) => {
        const seen = new Set(currentPosts.map((post) => post._id));
        return [
          ...currentPosts,
          ...(data.posts ?? []).filter((post: Post) => !seen.has(post._id)),
        ];
      });

      setCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message || 'Unable to load posts.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    if (!initialPost && !initialFetchStarted.current) {
      initialFetchStarted.current = true;
      load();
    }
  }, [initialPost, load]);

  /*
   * Listen for the sorting selection made from the Header bookmark menu.
   */
  useEffect(() => {
    function handleSortChange(event: Event) {
      const customEvent = event as CustomEvent<SortOption>;

      if (
        customEvent.detail === 'alphabetical' ||
        customEvent.detail === 'recent' ||
        customEvent.detail === 'relevant'
      ) {
        setSortOption(customEvent.detail);
        setIndex(0);
        x.set(0);
      }
    }

    window.addEventListener('feed-sort-change', handleSortChange);
    return () => {
      window.removeEventListener('feed-sort-change', handleSortChange);
    };
  }, [x]);

  /*
   * Sorting only affects posts that have already been loaded.
   */
  const displayedPosts = useMemo(() => {
    const sorted = [...posts];

    if (sortOption === 'alphabetical') {
      return sorted.sort((a, b) =>
        a.anime.trim().localeCompare(b.anime.trim(), undefined, {
          sensitivity: 'base',
        })
      );
    }

    if (sortOption === 'relevant') {
      const getScore = (post: Post) => {
        const tagScore = (post.tags?.length ?? 0) * 10;
        const animeScore = post.anime?.trim() ? 15 : 0;
        const createdTime = new Date(post.createdAt).getTime();
        const ageInDays = Math.max(
          0,
          (Date.now() - createdTime) / (1000 * 60 * 60 * 24)
        );
        const recencyScore = Math.max(0, 10 - ageInDays);

        return tagScore + animeScore + recencyScore;
      };

      return sorted.sort((a, b) => {
        const scoreDifference = getScore(b) - getScore(a);
        if (scoreDifference !== 0) return scoreDifference;

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    return sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, sortOption]);

  /*
   * Continue loading more posts as the user approaches the end.
   */
  useEffect(() => {
    if (displayedPosts.length - index <= 3 && cursor && !loading) {
      load();
    }
  }, [displayedPosts.length, index, cursor, loading, load]);

  const move = (dir: number) => {
    const next = index + dir;

    if (next >= 0 && next < displayedPosts.length) {
      setIndex(next);
      x.set(0);
    } else if (next >= displayedPosts.length && cursor) {
      load();
    }
  };

  const dragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -threshold) {
      move(1);
    } else if (info.offset.x > threshold) {
      move(-1);
    } else {
      x.set(0);
    }
  };

  /*
   * 1. Show skeleton while initial posts are loading (prevents false "No posts yet.")
   */
  if (initialLoading || (loading && !posts.length)) {
    return (
      <main className="min-h-screen bg-white pb-20 pt-14 text-black dark:bg-black dark:text-white">
        <section className="mx-auto flex w-full max-w-5xl flex-col px-4">
          <div className="h-[62vh] w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
          <div className="mt-7 space-y-4 px-2 sm:px-6">
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            <div className="mt-4 flex gap-3">
              <div className="h-9 w-28 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * 2. Show retry option if the request failed
   */
  if (error && !posts.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-sm text-black dark:bg-black dark:text-white">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setInitialLoading(true);
            load();
          }}
          className="rounded-full border border-black/20 px-5 py-2 text-xs font-medium transition hover:bg-black hover:text-white dark:border-white/20 dark:hover:bg-white dark:hover:text-black"
        >
          Retry
        </button>
      </main>
    );
  }

  /*
   * 3. Only show "No posts yet." after loading has actually finished
   */
  if (!posts.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-black dark:bg-black dark:text-white">
        No posts yet.
      </main>
    );
  }

  const post = displayedPosts[index];

  if (!post) {
    return null;
  }

  const author =
    typeof post.authorId === 'object' && post.authorId !== null
      ? post.authorId
      : null;

  const thread: ThreadItem[] = post.thread ?? [];

  return (
    <main className="min-h-screen bg-white pb-20 pt-14 text-black dark:bg-black dark:text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col">
        {/* MAIN MEDIA */}
        <div className="relative flex w-full items-center justify-center overflow-hidden bg-white px-2 dark:bg-black">
          <motion.div
            key={post._id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            style={{ x, rotate }}
            onDragEnd={dragEnd}
            className="media-shell flex w-full max-w-5xl touch-pan-y select-none items-center justify-center"
          >
            {post.mediaType === 'video' ? (
              <div className="relative flex w-full items-center justify-center">
                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  controls
                  className="max-h-[62vh] w-full object-contain sm:max-h-[65vh] lg:max-h-[68vh]"
                />

                <button
                  type="button"
                  aria-label="Pause or play"
                  onClick={() => {
                    if (videoRef.current?.paused) {
                      void videoRef.current.play();
                    } else {
                      videoRef.current?.pause();
                    }
                  }}
                  className="absolute bottom-5 right-5 rounded-full border border-black/15 bg-white/90 px-4 py-2 text-xs text-black dark:border-white/15 dark:bg-black/90 dark:text-white"
                >
                  Pause / Play
                </button>
              </div>
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.anime}
                draggable={false}
                className="max-h-[62vh] max-w-full object-contain sm:max-h-[65vh] lg:max-h-[68vh]"
              />
            )}
          </motion.div>

          {/* PREVIOUS */}
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label="Previous post"
            className="absolute left-3 rounded-full border border-black/15 bg-white px-4 py-2 text-sm text-black shadow-sm disabled:opacity-30 dark:border-white/15 dark:bg-black dark:text-white"
          >
            ←
          </button>

          {/* NEXT */}
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next post"
            className="absolute right-3 rounded-full border border-black/15 bg-white px-4 py-2 text-sm text-black shadow-sm dark:border-white/15 dark:bg-black dark:text-white"
          >
            →
          </button>
        </div>

        {/* POST DETAILS */}
        <article className="border-t border-black/10 px-5 py-7 text-black sm:px-10 sm:py-8 dark:border-white/10 dark:text-white">
          <p className="max-w-3xl text-base leading-7 text-black dark:text-white">
            {post.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {post.mediaType === 'video' && (
              <DownloadVideoButton postId={post._id} />
            )}
            <SavePostButton postId={post._id} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-black dark:text-white">
            <span className="rounded-full border border-black/15 px-4 py-2 text-sm text-black dark:border-white/15 dark:text-white">
              <span className="font-medium">Name:</span> {post.anime}
            </span>

            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/15 px-4 py-2 text-sm text-black dark:border-white/15 dark:text-white"
              >
                [{tag}]
              </span>
            ))}
          </div>

          {/* ADDITIONAL DETAILS / THREAD */}
          {thread.length > 0 && (
            <section className="mt-8 border-t border-black/10 pt-8 text-black dark:border-white/10 dark:text-white">
              <h2 className="mb-5 text-sm font-semibold text-black dark:text-white">
                Thread
              </h2>

              <div className="space-y-8">
                {thread.map((item, threadIndex) => (
                  <div
                    key={`${post._id}-thread-${threadIndex}`}
                    className="space-y-4"
                  >
                    <div className="flex w-full items-center justify-center overflow-hidden bg-white dark:bg-black">
                      {item.mediaType === 'video' ? (
                        <video
                          src={item.mediaUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls
                          className="max-h-[62vh] w-full object-contain sm:max-h-[65vh] lg:max-h-[68vh]"
                        />
                      ) : (
                        <img
                          src={item.mediaUrl}
                          alt=""
                          draggable={false}
                          className="max-h-[62vh] max-w-full object-contain sm:max-h-[65vh] lg:max-h-[68vh]"
                        />
                      )}
                    </div>

                    <p className="max-w-3xl text-base leading-7 text-black dark:text-white">
                      {item.description}
                    </p>

                    {threadIndex < thread.length - 1 && (
                      <div className="border-b border-black/10 pt-4 dark:border-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AUTHOR */}
          {author && (
            <div
              className={`relative z-10 flex items-center ${
                thread.length > 0
                  ? 'mt-8 border-t border-black/10 pt-7 dark:border-white/10'
                  : 'mt-7'
              }`}
            >
              <Link
                href={`/profile/${author._id}`}
                className="flex items-center gap-4 rounded-lg p-1 text-black transition-opacity hover:opacity-75 dark:text-white"
              >
                {author.profileImage ? (
                  <img
                    src={author.profileImage}
                    alt={author.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-sm font-semibold text-black dark:border-white/15 dark:text-white">
                    {author.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="text-sm text-black dark:text-white">
                  <b>{author.name}</b>
                  <span className="mx-2 text-black dark:text-white">·</span>
                  <span className="text-black dark:text-white">
                    {formatPostTime(post.createdAt)}
                  </span>
                </span>
              </Link>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}