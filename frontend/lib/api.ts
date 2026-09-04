export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001/api';

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('auth_token')
      : null;

  const headers = new Headers(
    options.headers
  );

  if (
    !headers.has('Content-Type') &&
    !(options.body instanceof FormData)
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
        'Something went wrong.'
    );
  }

  return data;
}