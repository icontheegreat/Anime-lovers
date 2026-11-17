'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type SavePostButtonProps = {
  postId: string;
  initialSaved?: boolean;
};

export default function SavePostButton({
  postId,
  initialSaved = false,
}: SavePostButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const isAuthed = Boolean(token);
    setLoggedIn(isAuthed);

    if (!isAuthed) return;

    let active = true;

    api('/posts/saved')
      .then((data) => {
        if (!active) return;
        const ids = new Set<string>(
          (data.posts ?? []).map((p: { _id: string }) => p._id)
        );
        setSavedIds(ids);
      })
      .catch(() => {
        // Ignore silent fetch errors; handleSave will surface auth errors if clicked
      });

    return () => {
      active = false;
    };
  }, []);

  // Keep button state accurate when swiping to a different post in Feed
  useEffect(() => {
    if (savedIds) {
      setSaved(savedIds.has(postId));
    } else {
      setSaved(initialSaved);
    }
  }, [postId, initialSaved, savedIds]);

  async function handleSave() {
    if (loading) return;

    if (!loggedIn) {
      window.alert('Please log in to save posts.');
      return;
    }

    setLoading(true);

    try {
      if (saved) {
        await api(`/posts/${postId}/save`, { method: 'DELETE' });
        setSaved(false);
        setSavedIds((prev) => {
          if (!prev) return prev;
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await api(`/posts/${postId}/save`, { method: 'POST' });
        setSaved(true);
        setSavedIds((prev) => {
          const next = new Set(prev ?? []);
          next.add(postId);
          return next;
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update saved post.';
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading}
      aria-label={saved ? 'Remove from saved posts' : 'Save post'}
      className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm text-black transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-black dark:text-white"
    >
      {loading
        ? saved
          ? 'Removing...'
          : 'Saving...'
        : saved
          ? 'Saved'
          : 'Save'}
    </button>
  );
}