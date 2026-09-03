'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '../lib/api';
import { Author } from '../types';

const socialFields = [
  { key: 'x', label: 'X' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'other', label: 'Other' },
];

export default function EditProfile() {
  const router = useRouter();

  const [author, setAuthor] = useState<Author | null>(null);

  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');

  const [socials, setSocials] = useState<Record<string, string>>({});

  const [profileImage, setProfileImage] =
    useState<File | null>(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/auth/me')
      .then((data) => {
        const user = data.author;

        setAuthor(user);
        setCountry(user.country || '');
        setBio(user.bio || '');
        setSocials(user.socials || {});
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, [router]);

  function updateSocial(key: string, value: string) {
    setSocials((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!country.trim()) {
      setError('Country is required.');
      return;
    }

    if (bio.length > 300) {
      setError('Bio cannot exceed 300 characters.');
      return;
    }

    /*
     * Only keep social links that actually contain a value.
     *
     * This means the user can have:
     * - X only
     * - Instagram only
     * - X + Instagram
     * - any combination
     * - no social links at all
     */
    const cleanedSocials = Object.fromEntries(
      Object.entries(socials)
        .map(([key, value]) => [
          key,
          String(value || '').trim(),
        ])
        .filter(([, value]) => value)
    );

    const formData = new FormData();

    formData.append('country', country.trim());
    formData.append('bio', bio.trim());

    formData.append(
      'socials',
      JSON.stringify(cleanedSocials)
    );

    /*
     * Profile image update.
     *
     * Only append profileImage when the user selected
     * a new image. If they don't select one, the backend
     * keeps the existing profile image.
     */
    if (profileImage) {
      formData.append(
        'profileImage',
        profileImage
      );
    }

    setBusy(true);

    try {
      await api('/profiles/me', {
        method: 'PUT',
        body: formData,
      });

      router.push('/profile');
    } catch (e: any) {
      setError(
        e?.message ||
          'Unable to update profile.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (!author) {
    return (
      <main className="min-h-screen px-5 pb-32 pt-24">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-32 pt-24">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Edit Profile
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Update your profile information and social links.
        </p>
      </div>

      <form
        onSubmit={save}
        className="space-y-6"
      >

        {/* PROFILE IMAGE */}
        <section>
          <label className="mb-3 block text-sm font-medium">
            Profile Picture
          </label>

          <div className="flex items-center gap-5">

            <img
              src={
                profileImage
                  ? URL.createObjectURL(profileImage)
                  : author.profileImage
              }
              alt={author.name}
              className="h-24 w-24 rounded-full object-cover"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file =
                  e.target.files?.[0] || null;

                setProfileImage(file);
              }}
              className="text-sm"
            />

          </div>
        </section>

        {/* COUNTRY */}
        <section>
          <label className="mb-2 block text-sm font-medium">
            Country
          </label>

          <input
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
            className="w-full rounded-lg border p-3"
            maxLength={80}
            required
          />
        </section>

        {/* BIO */}
        <section>
          <label className="mb-2 block text-sm font-medium">
            Bio
          </label>

          <textarea
            value={bio}
            onChange={(e) =>
              setBio(e.target.value)
            }
            maxLength={300}
            rows={5}
            placeholder="Tell people a little about yourself…"
            className="w-full rounded-lg border p-3"
          />

          <p className="mt-1 text-xs text-neutral-500">
            {bio.length}/300
          </p>
        </section>

        {/* SOCIAL LINKS */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Social Links
          </h2>

          <p className="mb-4 text-sm text-neutral-500">
            Social links are optional. You can add one,
            several, or none.
          </p>

          <div className="space-y-4">
            {socialFields.map((field) => (
              <div key={field.key}>

                <label className="mb-2 block text-sm font-medium">
                  {field.label}
                </label>

                <input
                  /*
                   * IMPORTANT:
                   * This is text instead of url.
                   *
                   * type="url" caused the browser to prevent
                   * the form from submitting when the value
                   * wasn't formatted as a complete URL.
                   */
                  type="text"
                  value={socials[field.key] || ''}
                  onChange={(e) =>
                    updateSocial(
                      field.key,
                      e.target.value
                    )
                  }
                  placeholder={`Your ${field.label} link or username`}
                  className="w-full rounded-lg border p-3"
                />

              </div>
            ))}
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ACTIONS */}
        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="rounded-lg border px-5 py-3 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
          >
            {busy
              ? 'Saving…'
              : 'Save Changes'}
          </button>

        </div>

      </form>
    </main>
  );
}