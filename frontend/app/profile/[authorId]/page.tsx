'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { api } from '../../../lib/api';
import { Author, Post } from '../../../types';

export default function AuthorProfilePage() {
  const params = useParams<{
    authorId: string;
  }>();

  const authorId = params.authorId;

  const [author, setAuthor] =
    useState<Author | null>(null);

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!authorId) return;

    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const data = await api(
          `/profiles/${authorId}`
        );

        if (!mounted) return;

        setAuthor(data.author);
        setPosts(data.posts || []);
      } catch (e: any) {
        if (!mounted) return;

        setError(
          e?.message ||
            'Unable to load profile.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [authorId]);

  if (loading) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-neutral-500">
            Loading profile…
          </p>
        </div>
      </main>
    );
  }

  if (error || !author) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">
            Profile not found
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            {error ||
              'This profile could not be found.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-24">
      <div className="mx-auto max-w-5xl">

        {/* PROFILE HEADER */}

        <section className="flex flex-col items-center border-b pb-10 text-center">

          {author.profileImage ? (
            <img
              src={author.profileImage}
              alt={author.name}
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border text-3xl font-semibold">
              {author.name
                ?.charAt(0)
                .toUpperCase()}
            </div>
          )}

          <h1 className="mt-5 text-2xl font-semibold">
            {author.name}
          </h1>

          {author.bio && (
            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              {author.bio}
            </p>
          )}
        </section>

        {/* PAST POSTS */}

        <section className="pt-10">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Past Posts
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                {posts.length}{' '}
                {posts.length === 1
                  ? 'post'
                  : 'posts'}
              </p>
            </div>
          </div>

          {!posts.length ? (
            <div className="rounded-xl border p-6">
              <p className="text-sm text-neutral-500">
                This author hasn't created any
                posts yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">

              {posts.map((post) => {
                const thread =
                  post.thread ?? [];

                return (
                  <article
                    key={post._id}
                    className="overflow-hidden rounded-xl border"
                  >

                    {/* MAIN MEDIA */}

                    {post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        playsInline
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.anime}
                        className="aspect-video w-full object-cover"
                      />
                    )}

                    <div className="p-5">

                      {/* ANIME */}

                      <p className="font-medium">
                        {post.anime}
                      </p>

                      {/* MAIN DESCRIPTION */}

                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        {post.description}
                      </p>

                      {/* TAGS */}

                      {post.tags?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.tags.map(
                            (tag) => (
                              <span
                                key={tag}
                                className="rounded-full border px-2.5 py-1 text-xs"
                              >
                                [{tag}]
                              </span>
                            )
                          )}
                        </div>
                      )}

                      {/* THREAD */}

                      {thread.length > 0 && (
                        <section className="mt-6 border-t pt-6">

                          <h3 className="mb-4 text-sm font-semibold">
                            Thread
                          </h3>

                          <div className="space-y-6">

                            {thread.map(
                              (
                                item,
                                index
                              ) => (
                                <div
                                  key={`${post._id}-thread-${index}`}
                                  className="space-y-3"
                                >

                                  {item.mediaType ===
                                  'video' ? (
                                    <video
                                      src={
                                        item.mediaUrl
                                      }
                                      controls
                                      playsInline
                                      className="aspect-video w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <img
                                      src={
                                        item.mediaUrl
                                      }
                                      alt=""
                                      className="aspect-video w-full rounded-lg object-cover"
                                    />
                                  )}

                                  <p className="text-sm leading-6 text-neutral-500">
                                    {
                                      item.description
                                    }
                                  </p>

                                </div>
                              )
                            )}

                          </div>
                        </section>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>
      </div>
    </main>
  );
}