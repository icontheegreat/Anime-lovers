export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001/api';

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

  const headers = new Headers(
    options.headers
  );

  // Don't manually set Content-Type for FormData.
  // The browser needs to create the multipart boundary.
  if (
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json'
    );
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }

  const res = await fetch(
    `${API}${path}`,
    {
      ...options,
      headers,
      credentials: 'include'
    }
  );

  const data = await res
    .json()
    .catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message ||
        `Request failed (${res.status}).`
    );
  }

  return data;
}