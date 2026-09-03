'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { Post, Author } from '../types';

const words = (s: string) =>
  s.trim().split(/\s+/).filter(Boolean).length;

type ThreadDraft = {
  file: File | null;
  description: string;
};

export default function Dashboard() {
  const [me, setMe] = useState<Author | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [description, setDescription] = useState('');
  const [anime, setAnime] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [media, setMedia] = useState<File | null>(null);

  const [threadItems, setThreadItems] = useState<ThreadDraft[]>([]);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const r = useRouter();

  const load = () =>
    api('/auth/me')
      .then((x) => setMe(x.author))
      .catch(() => r.push('/auth/login'))
      .then(() => api('/posts/mine'))
      .then((x) => setPosts(x.posts))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  function addTag() {
    const value = tagInput.trim();

    if (!value) return;
    if (tags.length >= 5) return;
    if (tags.includes(value)) return;

    setTags((current) => [...current, value]);
    setTagInput('');
  }

  function removeTag(index: number) {
    setTags((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function addThreadItem() {
    if (threadItems.length >= 5) return;

    setThreadItems((current) => [
      ...current,
      {
        file: null,
        description: ''
      }
    ]);
  }

  function removeThreadItem(index: number) {
    setThreadItems((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function updateThreadFile(
    index: number,
    file: File | null
  ) {
    setThreadItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              file
            }
          : item
      )
    );
  }

  function updateThreadDescription(
    index: number,
    value: string
  ) {
    setThreadItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              description: value
            }
          : item
      )
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!media) {
      return setError(
        'Please upload an image or video.'
      );
    }

    if (words(description) < 2) {
      return setError(
        'Description must contain at least 2 words.'
      );
    }

    if (!anime.trim()) {
      return setError('Anime title is required.');
    }

    /*
     * Main post video validation
     */
    if (media.type.startsWith('video/')) {
      try {
        const d = await videoDuration(media);

        if (d < 5) {
          return setError(
            'Video must be at least 5 seconds long.'
          );
        }

        if (d > 60) {
          return setError(
            'Video cannot exceed 60 seconds.'
          );
        }
      } catch {
        return setError(
          'Unable to read video duration.'
        );
      }
    }

    /*
     * Validate each thread item.
     */
    for (let i = 0; i < threadItems.length; i++) {
      const item = threadItems[i];

      if (!item.file) {
        return setError(
          `Please upload media for detail ${i + 1}.`
        );
      }

      if (words(item.description) < 2) {
        return setError(
          `Detail ${i + 1} description must contain at least 2 words.`
        );
      }

      if (item.file.type.startsWith('video/')) {
        try {
          const d = await videoDuration(item.file);

          if (d < 5) {
            return setError(
              `Video in detail ${i + 1} must be at least 5 seconds long.`
            );
          }

          if (d > 60) {
            return setError(
              `Video in detail ${i + 1} cannot exceed 60 seconds.`
            );
          }
        } catch {
          return setError(
            `Unable to read the video duration for detail ${i + 1}.`
          );
        }
      }
    }

    const fd = new FormData();

    /*
     * Main post
     */
    fd.append('media', media);
    fd.append('description', description);
    fd.append('anime', anime);
    fd.append('tags', JSON.stringify(tags));

    /*
     * Additional thread media.
     */
    threadItems.forEach((item, index) => {
      if (item.file) {
        fd.append(
          `threadMedia${index}`,
          item.file
        );
      }
    });

    /*
     * Thread descriptions.
     */
    fd.append(
      'threadDescriptions',
      JSON.stringify(
        threadItems.map((item) =>
          item.description.trim()
        )
      )
    );

    setBusy(true);

    try {
      await api('/posts', {
        method: 'POST',
        body: fd
      });

      /*
       * Reset everything after successful publish.
       */
      setDescription('');
      setAnime('');
      setTags([]);
      setTagInput('');
      setMedia(null);
      setThreadItems([]);

      const mediaInput =
        document.getElementById(
          'media'
        ) as HTMLInputElement | null;

      if (mediaInput) {
        mediaInput.value = '';
      }

      document
        .querySelectorAll<HTMLInputElement>(
          '.thread-media-input'
        )
        .forEach((input) => {
          input.value = '';
        });

      await load();
    } catch (e: any) {
      setError(
        e?.message ||
          'Unable to create post.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (
      !confirm(
        'Delete this post permanently from the active feed?'
      )
    ) {
      return;
    }

    try {
      await api(`/posts/${id}`, {
        method: 'DELETE'
      });

      setPosts((p) =>
        p.filter((x) => x._id !== id)
      );
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (!me) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-24">
      <section className="flex flex-col items-center border-b pb-10 text-center">
        <img
          src={me.profileImage}
          className="h-28 w-28 rounded-full object-cover"
          alt="Profile"
        />

        <h1 className="mt-5 text-xl font-semibold">
          {me.name}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {me.country}
        </p>
      </section>

      <section className="border-b py-10">
        <h2 className="mb-6 text-xl font-semibold">
          Create new post
        </h2>

        <form
          onSubmit={create}
          className="space-y-4"
        >
          {/* MAIN MEDIA */}

          <input
            id="media"
            required
            type="file"
            accept="image/*,video/*"
            onChange={(e) =>
              setMedia(
                e.target.files?.[0] || null
              )
            }
            className="block w-full text-sm"
          />

          {/* MAIN DESCRIPTION */}

          <textarea
            required
            minLength={2}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Write at least 2 words…"
            rows={5}
            className="w-full rounded-lg border p-3"
          />

          <div className="text-xs text-neutral-500">
            {words(description)} words
          </div>

          {/* ANIME */}

          <input
            required
            value={anime}
            onChange={(e) =>
              setAnime(e.target.value)
            }
            placeholder="Anime title"
            className="w-full rounded-lg border p-3"
          />

          {/* TAGS */}

          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Tags ({tags.length}/5)
            </label>

            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) =>
                  setTagInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={tags.length >= 5}
                placeholder="Add a tag"
                className="flex-1 rounded border px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={addTag}
                disabled={
                  !tagInput.trim() ||
                  tags.length >= 5
                }
                className="rounded border px-4 py-2 text-sm disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <button
                    key={`${tag}-${index}`}
                    type="button"
                    onClick={() =>
                      removeTag(index)
                    }
                    className="rounded-full border px-3 py-1 text-sm"
                  >
                    [{tag}] ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ADDITIONAL DETAILS / THREAD */}

          <div className="pt-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Additional details
                </h3>

                <p className="mt-1 text-xs text-neutral-500">
                  Optional · up to 5
                </p>
              </div>

              <span className="text-xs text-neutral-500">
                {threadItems.length}/5
              </span>
            </div>

            <div className="space-y-5">
              {threadItems.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Detail {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeThreadItem(index)
                        }
                        className="text-xs text-red-600 underline"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="thread-media-input block w-full text-sm"
                      onChange={(e) =>
                        updateThreadFile(
                          index,
                          e.target.files?.[0] ||
                            null
                        )
                      }
                    />

                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        updateThreadDescription(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Write at least 2 words…"
                      rows={4}
                      className="mt-4 w-full rounded-lg border p-3"
                    />

                    <div className="mt-1 text-xs text-neutral-500">
                      {words(
                        item.description
                      )}{' '}
                      words
                    </div>
                  </div>
                )
              )}
            </div>

            {threadItems.length < 5 && (
              <button
                type="button"
                onClick={addThreadItem}
                className="mt-4 rounded-lg border px-4 py-2 text-sm"
              >
                + Add another detail
              </button>
            )}
          </div>

          {/* ERROR */}

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {/* PUBLISH */}

          <button
            disabled={busy}
            className="rounded-lg bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
          >
            {busy
              ? 'Publishing…'
              : 'Publish'}
          </button>
        </form>
      </section>

      {/* YOUR POSTS */}

      <section className="py-10">
        <h2 className="mb-6 text-xl font-semibold">
          Your posts
        </h2>

        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p._id}
              className="flex gap-4 border p-3"
            >
              <img
                src={p.mediaUrl}
                className="h-24 w-24 object-cover"
                alt=""
              />

              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.anime}
                </p>

                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                  {p.description}
                </p>

                {p.thread &&
                  p.thread.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {p.thread.length}{' '}
                      additional{' '}
                      {p.thread.length === 1
                        ? 'detail'
                        : 'details'}
                    </p>
                  )}

                {p.deletedAt ? (
                  <span className="text-xs text-red-600">
                    Deleted
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      del(p._id)
                    }
                    className="mt-3 text-xs underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {!posts.length && (
            <p className="text-sm text-neutral-500">
              You haven't created any posts yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function videoDuration(file: File) {
  return new Promise<number>(
    (resolve, reject) => {
      const v =
        document.createElement('video');

      v.preload = 'metadata';

      v.onloadedmetadata = () => {
        URL.revokeObjectURL(v.src);
        resolve(v.duration);
      };

      v.onerror = () => {
        URL.revokeObjectURL(v.src);
        reject(
          new Error(
            'Unable to read video duration.'
          )
        );
      };

      v.src = URL.createObjectURL(file);
    }
  );
}