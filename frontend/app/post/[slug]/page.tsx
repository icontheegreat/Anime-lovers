'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import { api } from '../../../lib/api';
import { Post, Author, ThreadItem } from '../../../types';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/posts/${slug}`)
      .then((x) => setPost(x.post))
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center">
          {error}
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center text-neutral-500">
          Loading…
        </main>
      </>
    );
  }

  const author = post.authorId as Author;
  const thread: ThreadItem[] = post.thread ?? [];

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl pt-16">

        {/* MAIN MEDIA */}

        <div className="media-shell h-[70vh] w-full">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.anime}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* POST DETAILS */}

        <article className="border-t px-5 py-10">

          {/* MAIN DESCRIPTION */}

          <p className="leading-7">
            {post.description}
          </p>

          {/* ANIME + TAGS */}

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="rounded-full border px-4 py-2 text-sm">
              {post.anime}
            </span>

            {post.tags?.map((tag) => (
              <span
                className="rounded-full border px-4 py-2 text-sm"
                key={tag}
              >
                [{tag}]
              </span>
            ))}
          </div>

          {/* ADDITIONAL DETAILS / THREAD */}

          {thread.length > 0 && (
            <section className="mt-10 border-t pt-10">
              <h2 className="mb-6 text-sm font-semibold">
                More details
              </h2>

              <div className="space-y-10">
                {thread.map((item, threadIndex) => (
                  <div
                    key={`${post._id}-thread-${threadIndex}`}
                    className="space-y-5"
                  >

                    {/* THREAD MEDIA */}

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
                          className="max-h-[70vh] w-full object-contain"
                        />
                      )}
                    </div>

                    {/* THREAD DESCRIPTION */}

                    <p className="leading-7">
                      {item.description}
                    </p>

                    {/* DIVIDER BETWEEN THREAD ITEMS */}

                    {threadIndex < thread.length - 1 && (
                      <div className="border-b pt-5" />
                    )}

                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AUTHOR */}

          <div
            className={`flex items-center gap-3 ${
              thread.length > 0
                ? 'mt-10 border-t pt-8'
                : 'mt-7'
            }`}
          >
            <img
              src={author.profileImage}
              className="h-10 w-10 rounded-full object-cover"
              alt=""
            />

            <span className="text-sm">
              {author.name} · {author.country}
            </span>
          </div>

        </article>
      </main>
    </>
  );
}