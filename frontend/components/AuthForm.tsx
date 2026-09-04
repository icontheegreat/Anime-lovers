'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      if (data.token) {
       localStorage.setItem('auth_token', data.token);
      }

      router.push('/profile');
    } catch (e: any) {
      setError(
        e?.message ||
          'Login failed.'
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4"
    >
      <Field
        label="Email"
        type="email"
        value={email}
        set={setEmail}
      />

      <Field
        label="Password"
        type="password"
        value={password}
        set={setPassword}
      />

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-black px-4 py-3 text-white"
      >
        Log in
      </button>

      <p className="text-sm text-neutral-500">
        No account?{' '}
        <Link
          href="/auth/register"
          className="text-black underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [file, setFile] =
    useState<File | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError(
        'Profile image is required.'
      );
      return;
    }

    const fd = new FormData();

    fd.append('name', name);
    fd.append('email', email);
    fd.append('password', password);
    fd.append('country', country);
    fd.append('profileImage', file);

    try {
      const data =
        await api('/auth/register', {
          method: 'POST',
          body: fd
        });

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      router.push('/profile');
    } catch (e: any) {
      setError(
        e?.message ||
          'Registration failed.'
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4"
    >
      <Field
        label="Username"
        value={name}
        set={setName}
      />

      <Field
        label="Email"
        type="email"
        value={email}
        set={setEmail}
      />

      <Field
        label="Password (8+ characters)"
        type="password"
        value={password}
        set={setPassword}
      />

      <Field
        label="Country"
        value={country}
        set={setCountry}
      />

      <label className="block text-sm">
        Profile image

        <input
          required
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] || null
            )
          }
          className="mt-2 block w-full text-sm"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-black px-4 py-3 text-white"
      >
        Create account
      </button>

      <p className="text-sm text-neutral-500">
        Already registered?{' '}
        <Link
          href="/auth/login"
          className="text-black underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  type = 'text',
  value,
  set
}: {
  label: string;
  type?: string;
  value: string;
  set: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}

      <input
        required
        type={type}
        value={value}
        onChange={(e) =>
          set(e.target.value)
        }
        className="mt-2 w-full rounded-lg border px-3 py-3 outline-none focus:border-black"
      />
    </label>
  );
}