export const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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
    throw new Error(
      data.message || 'Something went wrong.'
    );
  }

  return data;
}

export type Author = {
  _id: string;

  id?: string;

  name: string;

  email?: string;

  country: string;

  profileImage: string;

  bio?: string;

  socials?: Record<string, string>;
};

export type ThreadItem = {
  mediaType: 'image' | 'video';

  mediaUrl: string;

  mediaPublicId: string;

  description: string;
};

export type Post = {
  _id: string;

  authorId: Author | string;

  mediaType: 'image' | 'video';

  mediaUrl: string;

  mediaPublicId?: string;

  description: string;

  anime: string;

  tags: string[];

  thread?: ThreadItem[];

  slug: string;

  createdAt: string;

  deletedAt?: string | null;
};