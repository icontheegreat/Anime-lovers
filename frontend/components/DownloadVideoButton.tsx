'use client';

import { useState } from 'react';

type DownloadVideoButtonProps = {
  postId: string;
};

export default function DownloadVideoButton({
  postId,
}: DownloadVideoButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const theme =
        document.documentElement.classList.contains(
          'dark'
        )
          ? 'dark'
          : 'light';

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:5001/api';

      const response = await fetch(
        `${apiUrl}/posts/${postId}/download?theme=${theme}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.message ||
            'Unable to download video.'
        );
      }

      const blob = await response.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = blobUrl;
      link.download =
        `anime-video-${postId}.mp4`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      console.error(
        'Video download failed:',
        e
      );

      setError(
        e?.message ||
          'Unable to download video.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy
          ? 'Preparing…'
          : 'Download Video'}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}