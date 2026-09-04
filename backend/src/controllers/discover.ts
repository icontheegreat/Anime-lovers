import { Response } from 'express';

import { Post } from '../models/Post';
import { AuthRequest } from '../middleware/auth';
import { env } from '../config/env';

type DiscoverAnime = {
  query: string;

  id: number;

  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
    userPreferred: string | null;
  };

  coverImage: string | null;
  bannerImage: string | null;

  status: string | null;
  episodes: number | null;
  format: string | null;
  siteUrl: string | null;

  nextAiringEpisode: {
    airingAt: number;
    episode: number;
  } | null;
};

type DiscoverData = {
  recentlyTalked: {
    name: string;
    count: number;
  }[];

  anime: DiscoverAnime[];

  youtube: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
  }[];

  news: {
    title: string;
    link: string;
    source: string;
    pubDate: string;
  }[];
};

/*
 * Simple in-memory cache.
 */
const cache = new Map<
  string,
  {
    expiresAt: number;
    value: unknown;
  }
>();

async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);

  if (
    existing &&
    existing.expiresAt > Date.now()
  ) {
    return existing.value as T;
  }

  const value = await loader();

  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });

  return value;
}

/*
 * =========================================================
 * ANILIST
 * =========================================================
 */

async function fetchAniListAnime(
  query: string
): Promise<DiscoverAnime | null> {
  const gql = `
    query ($search: String) {
      Media(
        search: $search
        type: ANIME
      ) {
        id

        title {
          romaji
          english
          native
          userPreferred
        }

        coverImage {
          large
        }

        bannerImage
        status
        episodes
        format
        siteUrl

        nextAiringEpisode {
          airingAt
          episode
        }
      }
    }
  `;

  const response = await fetch(
    'https://graphql.anilist.co',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },

      body: JSON.stringify({
        query: gql,
        variables: {
          search: query,
        },
      }),

      signal: AbortSignal.timeout(8000),
    }
  );

  if (!response.ok) {
    return null;
  }

  const json = await response.json();

  if (
    json?.errors ||
    !json?.data?.Media
  ) {
    return null;
  }

  const media = json.data.Media;

  return {
    query,

    id: media.id,

    title: {
      romaji:
        media.title?.romaji ?? null,

      english:
        media.title?.english ?? null,

      native:
        media.title?.native ?? null,

      userPreferred:
        media.title?.userPreferred ?? null,
    },

    coverImage:
      media.coverImage?.large ?? null,

    bannerImage:
      media.bannerImage ?? null,

    status:
      media.status ?? null,

    episodes:
      media.episodes ?? null,

    format:
      media.format ?? null,

    siteUrl:
      media.siteUrl ?? null,

    nextAiringEpisode:
      media.nextAiringEpisode
        ? {
            airingAt:
              media.nextAiringEpisode.airingAt,

            episode:
              media.nextAiringEpisode.episode,
          }
        : null,
  };
}

/*
 * =========================================================
 * YOUTUBE
 * =========================================================
 */

async function fetchYouTube(
  topics: string[]
) {
  if (!env.youtubeApiKey) {
    return [];
  }

  if (!topics.length) {
    return [];
  }

  const query = topics
    .slice(0, 3)
    .join(' ');

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    maxResults: '8',
    order: 'date',
    type: 'video',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
    key: env.youtubeApiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    {
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!response.ok) {
    console.error(
      'YouTube request failed:',
      response.status
    );

    return [];
  }

  const json = await response.json();

  if (!Array.isArray(json?.items)) {
    return [];
  }

  return json.items
    .filter(
      (item: any) =>
        item?.id?.videoId
    )
    .map((item: any) => ({
      id: item.id.videoId,

      title:
        item.snippet?.title ?? '',

      description:
        item.snippet?.description ?? '',

      thumbnail:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        '',

      channelTitle:
        item.snippet?.channelTitle ?? '',

      publishedAt:
        item.snippet?.publishedAt ?? '',
    }));
}

/*
 * =========================================================
 * GOOGLE NEWS RSS
 * =========================================================
 */

function decodeXml(value: string) {
  return value
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/g,
      '$1'
    )
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractXmlTag(
  xml: string,
  tag: string
) {
  const pattern = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    'i'
  );

  const match = xml.match(pattern);

  if (!match) {
    return '';
  }

  return decodeXml(match[1]);
}

async function fetchNews(
  topics: string[]
) {
  if (!topics.length) {
    return [];
  }

  const query =
    `${topics.slice(0, 3).join(' OR ')} anime`;

  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=en-US&gl=US&ceid=US:en`;

  const response = await fetch(
    url,
    {
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!response.ok) {
    console.error(
      'News request failed:',
      response.status
    );

    return [];
  }

  const xml = await response.text();

  const items =
    xml.match(
      /<item>[\s\S]*?<\/item>/gi
    ) ?? [];

  return items
    .slice(0, 8)
    .map((item) => ({
      title: extractXmlTag(
        item,
        'title'
      ),

      link: extractXmlTag(
        item,
        'link'
      ),

      source: extractXmlTag(
        item,
        'source'
      ),

      pubDate: extractXmlTag(
        item,
        'pubDate'
      ),
    }))
    .filter(
      (item) =>
        item.title &&
        item.link
    );
}

/*
 * =========================================================
 * DISCOVER
 * =========================================================
 */

export async function discover(
  _req: AuthRequest,
  res: Response
) {
  try {
    /*
     * Last 24 hours.
     */
    const since =
      new Date(
        Date.now() -
          24 * 60 * 60 * 1000
      );

    /*
     * Find the anime most discussed
     * by your users in the last 24 hours.
     */
    const recentlyTalked =
      await Post.aggregate([
        {
          $match: {
            deletedAt: null,

            createdAt: {
              $gte: since,
            },
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $group: {
            _id: {
              $toLower: '$anime',
            },

            name: {
              $first: '$anime',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },

        {
          $limit: 8,
        },

        {
          $project: {
            _id: 0,
            name: 1,
            count: 1,
          },
        },
      ]);

    /*
     * These topics power the external sources.
     */
    const topics =
      recentlyTalked.map(
        (item) => item.name
      );

    /*
     * AniList.
     */
    const animeResults =
      await Promise.all(
        topics
          .slice(0, 4)
          .map((topic) =>
            cached(
              `anilist:${topic.toLowerCase()}`,
              5 * 60 * 1000,
              () =>
                fetchAniListAnime(
                  topic
                )
            )
          )
      );

    const anime =
      animeResults.filter(
        (
          item
        ): item is DiscoverAnime =>
          Boolean(item)
      );

    /*
     * YouTube + News.
     */
    const [youtube, news] =
      await Promise.all([
        cached(
          `youtube:${topics
            .join('|')
            .toLowerCase()}`,
          5 * 60 * 1000,
          () =>
            fetchYouTube(
              topics
            )
        ),

        cached(
          `news:${topics
            .join('|')
            .toLowerCase()}`,
          5 * 60 * 1000,
          () =>
            fetchNews(
              topics
            )
        ),
      ]);

    const result: DiscoverData = {
      recentlyTalked,
      anime,
      youtube,
      news,
    };

    return res.json(result);
  } catch (error: any) {
    console.error(
      'Discover error:',
      error
    );

    return res.status(500).json({
      message:
        'Unable to load Discover.',
    });
  }
}