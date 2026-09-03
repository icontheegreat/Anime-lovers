'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from '../lib/api';
import { Post, Author, ThreadItem } from '../types';

const threshold = 110;

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

  const x = useMotionValue(0);

  const rotate = useTransform(
    x,
    [-250, 250],
    [-8, 8]
  );

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const load = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      const q = cursor
        ? `?limit=8&cursor=${encodeURIComponent(cursor)}`
        : '?limit=8';

      const data = await api('/posts' + q);

      setPosts((currentPosts) => {
        const seen = new Set(
          currentPosts.map((post) => post._id)
        );

        return [
          ...currentPosts,
          ...data.posts.filter(
            (post: Post) => !seen.has(post._id)
          ),
        ];
      });

      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    if (!posts.length) {
      load();
    }
  }, [posts.length, load]);

  useEffect(() => {
    if (
      posts.length - index <= 3 &&
      cursor
    ) {
      load();
    }
  }, [
    posts.length,
    index,
    cursor,
    load,
  ]);

  const move = (dir: number) => {
    const next = index + dir;

    if (
      next >= 0 &&
      next < posts.length
    ) {
      setIndex(next);
      x.set(0);
    } else if (
      next >= posts.length &&
      cursor
    ) {
      load();
    }
  };

  const dragEnd = (
    _event:
      | MouseEvent
      | TouchEvent
      | PointerEvent,
    info: PanInfo
  ) => {
    if (
      info.offset.x < -threshold
    ) {
      move(1);
    } else if (
      info.offset.x > threshold
    ) {
      move(-1);
    } else {
      x.set(0);
    }
  };

  if (!posts.length) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        No posts yet.
      </main>
    );
  }

  const post = posts[index];
  const author = post.authorId as Author;

  // Only render details that actually exist.
  const thread: ThreadItem[] =
    post.thread ?? [];

  return (
    <main className="min-h-screen bg-white pb-20 pt-14">

      <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col">

        {/* MAIN MEDIA */}

        <div className="relative flex min-h-[70vh] flex-1 items-center justify-center overflow-hidden bg-white px-2">

          <motion.div
            key={post._id}
            drag="x"
            dragConstraints={{
              left: 0,
              right: 0,
            }}
            dragElastic={0.22}
            style={{
              x,
              rotate,
            }}
            onDragEnd={dragEnd}
            className="media-shell h-[70vh] w-full max-w-5xl touch-pan-y select-none"
          >

            {post.mediaType === 'video' ? (
              <div className="relative h-full w-full">

                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-contain"
                />

                <button
                  aria-label="Pause or play"
                  onClick={() => {
                    if (
                      videoRef.current?.paused
                    ) {
                      videoRef.current?.play();
                    } else {
                      videoRef.current?.pause();
                    }
                  }}
                  className="absolute bottom-5 right-5 rounded-full border border-black/15 bg-white/90 px-4 py-2 text-xs"
                >
                  Pause / Play
                </button>

              </div>
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.anime}
                draggable={false}
                className="h-full w-full object-contain"
              />
            )}

          </motion.div>

          {/* PREVIOUS */}

          <button
            onClick={() => move(-1)}
            disabled={index === 0}
            className="absolute left-3 rounded-full border bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-30"
          >
            ←
          </button>

          {/* NEXT */}

          <button
            onClick={() => move(1)}
            className="absolute right-3 rounded-full border bg-white px-4 py-2 text-sm shadow-sm"
          >
            →
          </button>

        </div>

        {/* POST DETAILS */}

        <article className="border-t px-5 py-10 sm:px-10">

          {/* MAIN DESCRIPTION */}

          <p className="max-w-3xl text-base leading-7">
            {post.description}
          </p>

          {/* ANIME + TAGS */}

          <div className="mt-6 flex flex-wrap gap-3">

            <span className="rounded-full border px-4 py-2 text-sm">
              {post.anime}
            </span>

            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-4 py-2 text-sm"
              >
                [{tag}]
              </span>
            ))}

          </div>

          {/* ADDITIONAL DETAILS */}

          {thread.length > 0 && (
            <section className="mt-10 border-t pt-10">

              <h2 className="mb-6 text-sm font-semibold">
                Threads
              </h2>

              <div className="space-y-10">

                {thread.map(
                  (item, threadIndex) => (
                    <div
                      key={`${post._id}-thread-${threadIndex}`}
                      className="space-y-5"
                    >

                      {/* DETAIL MEDIA */}

                      <div className="overflow-hidden bg-white">

                        {item.mediaType === 'video' ? (
                          <video
                            src={item.mediaUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            controls
                            className="max-h-[70vh] w-full object-contain"
                          />
                        ) : (
                          <img
                            src={item.mediaUrl}
                            alt=""
                            draggable={false}
                            className="max-h-[70vh] w-full object-contain"
                          />
                        )}

                      </div>

                      {/* DETAIL DESCRIPTION */}

                      <p className="max-w-3xl text-base leading-7">
                        {item.description}
                      </p>

                      {/* DIVIDER */}

                      {threadIndex <
                        thread.length - 1 && (
                        <div className="border-b pt-5" />
                      )}

                    </div>
                  )
                )}

              </div>

            </section>
          )}

          {/* AUTHOR */}

          <div
            className={`flex items-center gap-4 ${
              thread.length > 0
                ? 'mt-10 border-t pt-8'
                : 'mt-8'
            }`}
          >

            <img
              src={author.profileImage}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />

            <span className="text-sm">

              <b>{author.name}</b>

              <span className="mx-2 text-neutral-400">
                ·
              </span>

              {author.country}

            </span>

          </div>

        </article>

      </section>

    </main>
  );
}