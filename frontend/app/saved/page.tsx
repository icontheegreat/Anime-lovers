'use client';

import Link from 'next/link';
import {
  useEffect,
  useState
} from 'react';

import { api } from '../../lib/api';
import { Post } from '../../types';

export default function SavedPostsPage() {
  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadSavedPosts() {
      try {
        const token =
          localStorage.getItem(
            'auth_token'
          );

        if (!token) {
          setError(
            'Please log in to view your saved posts.'
          );
          return;
        }

        const data =
          await api('/posts/saved');

        setPosts(
          data.posts ?? []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load saved posts.'
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSavedPosts();
  }, []);

  async function removeSavedPost(
    postId: string
  ) {
    try {
      await api(
        `/posts/${postId}/save`,
        {
          method: 'DELETE'
        }
      );

      setPosts(
        (current) =>
          current.filter(
            (post) =>
              post._id !== postId
          )
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to remove saved post.'
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-5 py-20 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-5xl">
          Loading saved posts...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-5 py-20 text-black dark:bg-black dark:text-white">
        <div className="mx-auto max-w-5xl">
          <p>{error}</p>

          <Link
            href="/auth/login"
            className="mt-5 inline-block underline"
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 pb-24 pt-20 text-black dark:bg-black dark:text-white">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            Saved Posts
          </h1>

          <p className="mt-2 text-sm opacity-60">
            Posts you have saved.
          </p>
        </div>

        {!posts.length ? (
          <div className="border-t border-black/10 py-12 dark:border-white/10">
            <p className="text-sm opacity-60">
              No saved posts yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => {
              const author =
                typeof post.authorId ===
                  'object' &&
                post.authorId !== null
                  ? post.authorId
                  : null;

              return (
                <article
                  key={post._id}
                  className="border-t border-black/10 pt-7 dark:border-white/10"
                >
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="flex w-full items-center justify-center overflow-hidden bg-white dark:bg-black sm:w-80">
                      {post.mediaType ===
                      'video' ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          playsInline
                          className="max-h-80 w-full object-contain"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.anime}
                          className="max-h-80 w-full object-contain"
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">
                        {post.anime}
                      </h2>

                      <p className="mt-3 text-sm leading-6">
                        {post.description}
                      </p>

                      {post.tags?.length >
                        0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.tags.map(
                            (tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-black/15 px-3 py-1 text-xs dark:border-white/15"
                              >
                                [{tag}]
                              </span>
                            )
                          )}
                        </div>
                      )}

                      {author && (
                        <Link
                          href={`/profile/${author._id}`}
                          className="mt-5 flex items-center gap-3 text-sm hover:opacity-70"
                        >
                          {author.profileImage ? (
                            <img
                              src={
                                author.profileImage
                              }
                              alt={
                                author.name
                              }
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-xs dark:border-white/15">
                              {author.name
                                ?.charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>
                          )}

                          <span>
                            {author.name}
                          </span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeSavedPost(
                            post._id
                          )
                        }
                        className="mt-6 rounded-full border border-black/15 px-4 py-2 text-sm hover:opacity-70 dark:border-white/15"
                      >
                        Remove from saved
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}