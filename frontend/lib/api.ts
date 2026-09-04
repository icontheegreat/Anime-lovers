export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5001/api';

export async function api(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}