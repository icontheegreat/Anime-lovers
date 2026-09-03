'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../lib/api';
import { Author, Post } from '../types';

export default function Profile() {
  const router = useRouter();

  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get logged-in user
        const data = await api('/auth/me');

        console.log('AUTH RESPONSE:', data);

        setAuthor(data.author);

        // IMPORTANT:
        // Use the same endpoint Dashboard uses.
        try {
          const postsData = await api('/posts/mine');

          console.log('MY POSTS RESPONSE:', postsData);

          setPosts(postsData.posts || []);
        } catch (error) {
          console.error('POSTS ERROR:', error);
          setPostsError('Unable to load your posts.');
        } finally {
          setPostsLoading(false);
        }
      } catch (error) {
        console.error('AUTH ERROR:', error);

        setAuthor(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen px-5 pb-32 pt-24">
        <div className="mx-auto max-w-4xl">
          <p>Loading profile…</p>
        </div>
      </main>
    );
  }

  if (!author) {
    return (
      <main className="min-h-screen px-5 pb-32 pt-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold">
            My Profile
          </h1>

          <p className="mt-4 text-neutral-500">
            Please log in to view your profile.
          </p>

          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="mt-6 rounded-lg border px-5 py-2.5 text-sm"
          >
            Log In
          </button>
        </div>
      </main>
    );
  }

  const socials = author.socials || {};

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 pb-32 pt-24">

      {/* PROFILE HEADER */}
      <section className="flex flex-col items-center text-center">

        {author.profileImage ? (
          <img
            src={author.profileImage}
            alt={author.name}
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border text-3xl font-semibold">
            {author.name?.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="mt-5 text-2xl font-semibold">
          {author.name}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {author.country}
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          {author.email}
        </p>

        {author.bio && (
          <p className="mt-5 max-w-xl text-sm leading-7">
            {author.bio}
          </p>
        )}

        {/* PROFILE ACTIONS */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/profile/edit')}
            className="rounded-lg border px-5 py-2.5 text-sm"
          >
            Edit Profile
          </button>

          <button
            type="button"
            onClick={() => {
              console.log('Logout clicked');
            }}
            className="rounded-lg border px-5 py-2.5 text-sm"
          >
            Log Out
          </button>
        </div>
      </section>

      {/* SOCIAL LINKS */}
      {Object.keys(socials).length > 0 && (
        <section className="mt-10 border-t pt-8">
          <h2 className="mb-4 text-lg font-semibold">
            Social Links
          </h2>

          <div className="flex flex-wrap gap-3">
            {Object.entries(socials).map(
              ([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-4 py-2 text-sm capitalize"
                >
                  {platform}
                </a>
              )
            )}
          </div>
        </section>
      )}

      {/* POSTS */}
      <section className="mt-10 border-t pt-8">
        <h2 className="mb-6 text-lg font-semibold">
          Past Posts
        </h2>

        {postsLoading ? (
          <p className="text-sm text-neutral-500">
            Loading your posts…
          </p>
        ) : postsError ? (
          <p className="text-sm text-red-600">
            {postsError}
          </p>
        ) : !posts.length ? (
          <p className="text-sm text-neutral-500">
            You haven't created any posts yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post._id}
                className="overflow-hidden rounded-xl border"
              >
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

                <div className="p-4">
                  <p className="font-medium">
                    {post.anime}
                  </p>

                  <p className="mt-2 line-clamp-3 text-sm text-neutral-500">
                    {post.description}
                  </p>

                  {post.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-2.5 py-1 text-xs"
                        >
                          [{tag}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}