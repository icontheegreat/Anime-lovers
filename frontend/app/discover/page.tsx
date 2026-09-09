'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '../../lib/api';

type RecentlyTalked = {
  name: string;
  count: number;
};

type PopularAnime = {
  name: string;
  image: string | null;
};

type PopularAuthor = {
  _id: string;
  name: string;
  profileImage: string | null;
};

type AnimeResult = {
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

type YouTubeResult = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
};

type NewsResult = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
};

type DiscoverData = {
  recentlyTalked: RecentlyTalked[];
  popularAnime: PopularAnime[];
  anime: AnimeResult[];
  youtube: YouTubeResult[];
  news: NewsResult[];
  popularAuthors: PopularAuthor[];
};

function preferredTitle(
  anime: AnimeResult
) {
  return (
    anime.title.userPreferred ||
    anime.title.english ||
    anime.title.romaji ||
    anime.title.native ||
    anime.query
  );
}

function airingText(
  anime: AnimeResult
) {
  if (!anime.nextAiringEpisode) {
    return null;
  }

  const date = new Date(
    anime.nextAiringEpisode.airingAt * 1000
  );

  return `Episode ${
    anime.nextAiringEpisode.episode
  } · ${date.toLocaleString()}`;
}

export default function DiscoverPage() {
  const [data, setData] =
    useState<DiscoverData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDiscover() {
      try {
        setLoading(true);
        setError('');

        const result =
          await api('/discover');

        if (mounted) {
          setData(result);
        }
      } catch (e: any) {
        if (mounted) {
          setError(
            e?.message ||
              'Unable to load Discover.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDiscover();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-5 pb-24 pt-20 dark:bg-black dark:text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold">
            Discover
          </h1>

          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Loading what the community is
            talking about…
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white px-5 pb-24 pt-20 dark:bg-black dark:text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold">
            Discover
          </h1>

          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white pb-24 pt-20 text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-5xl px-5">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="mb-10">
          <h1 className="text-3xl font-semibold">
            Discover
          </h1>

          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Explore what fans are
            talking about right now.
          </p>
        </header>

        {/* ================================================= */}
        {/* RECENTLY TALKED ABOUT */}
        {/* ================================================= */}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Recently talked about
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Based on what community is talking about.
            </p>
          </div>

          {data.recentlyTalked.length === 0 ? (
            <div className="rounded-xl border border-black p-6 dark:border-white">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Nothing to talk about.
              </p>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-black p-4 sm:max-h-48 dark:border-white">
              <div className="flex flex-wrap gap-3">
                {data.recentlyTalked.map((topic) => (
                  <div
                    key={topic.name}
                    className="rounded-full border border-black px-4 py-2 dark:border-white"
                  >
                    <span className="text-sm font-medium">
                      {topic.name}
                    </span>

                    <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {topic.count}{' '}
                      {topic.count === 1
                        ? 'post'
                        : 'posts'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* POPULAR IN THE COMMUNITY */}
        {/* ================================================= */}

        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Popular in the Community
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              The anime getting the most attention.
            </p>
          </div>

          {data.popularAnime.length === 0 ? (
            <div className="rounded-xl border border-black p-6 dark:border-white">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Nothing is popular yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              {data.popularAnime.map(
                (anime, index) => (
                  <article
                    key={anime.name}
                    className="overflow-hidden rounded-xl border border-black bg-white dark:border-white dark:bg-black"
                  >
                    {/* IMAGE */}

                    {anime.image ? (
                      <img
                        src={anime.image}
                        alt={anime.name}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                        No image available
                      </div>
                    )}

                    {/* INFO */}

                    <div className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        #{index + 1} Popular
                      </p>

                      <h3 className="mt-1 text-base font-semibold">
                        {anime.name}
                      </h3>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* WHAT'S HAPPENING NOW */}
        {/* ================================================= */}

        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              What's happening now
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Anime information related to
              recent community topics.
            </p>
          </div>

          {data.anime.length === 0 ? (
            <div className="rounded-xl border border-black p-6 dark:border-white">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No information
                is available right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.anime.map(
                (anime) => (
                  <article
                    key={`${anime.id}-${anime.query}`}
                    className="overflow-hidden rounded-xl border border-black dark:border-white"
                  >
                    {anime.coverImage && (
                      <img
                        src={anime.coverImage}
                        alt={preferredTitle(
                          anime
                        )}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    )}

                    <div className="p-4">
                      <h3 className="font-medium">
                        {preferredTitle(
                          anime
                        )}
                      </h3>

                      <div className="mt-2 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {anime.status && (
                          <p>
                            {anime.status}
                          </p>
                        )}

                        {anime.episodes && (
                          <p>
                            {anime.episodes}{' '}
                            episodes
                          </p>
                        )}

                        {airingText(
                          anime
                        ) && (
                          <p>
                            {airingText(
                              anime
                            )}
                          </p>
                        )}
                      </div>

                      {anime.siteUrl && (
                        <a
                          href={anime.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block text-sm underline"
                        >
                          View anime
                        </a>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* YOUTUBE */}
        {/* ================================================= */}

        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Live
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Recent videos related to what
              the community is discussing.
            </p>
          </div>

          {data.youtube.length === 0 ? (
            <div className="rounded-xl border border-black p-6 dark:border-white">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No YouTube results are
                available yet.
              </p>

              <p className="mt-2 text-xs text-neutral-400">
                Add YOUTUBE_API_KEY to the
                backend environment to enable
                this section.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {data.youtube.map(
                (video) => (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-xl border border-black dark:border-white"
                  >
                    <div className="aspect-video w-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.title}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium">
                        {video.title}
                      </h3>

                      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {video.channelTitle}
                      </p>

                      {video.publishedAt && (
                        <p className="mt-1 text-xs text-neutral-400">
                          {new Date(
                            video.publishedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* NEWS */}
        {/* ================================================= */}

        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Anime News
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Latest headlines related to
              the current topics.
            </p>
          </div>

          {data.news.length === 0 ? (
            <div className="rounded-xl border border-black p-6 dark:border-white">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No related news is available
                right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black rounded-xl border border-black dark:divide-white dark:border-white">
              {data.news.map(
                (article, index) => (
                  <a
                    key={`${article.link}-${index}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    <h3 className="font-medium">
                      {article.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {article.source && (
                        <span>
                          {article.source}
                        </span>
                      )}

                      {article.pubDate && (
                        <span>
                          ·{' '}
                          {new Date(
                            article.pubDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </a>
                )
              )}
            </div>
          )}
        </section>

  {/* ================================================= */}
{/* POPULAR AUTHORS */}
{/* ================================================= */}

<section className="mt-14">
  <div className="mb-5">
    <h2 className="text-xl font-semibold">
      Popular Authors
    </h2>

    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
      Authors the community is posting with most.
    </p>
  </div>

  {data.popularAuthors.length === 0 ? (
    <div className="rounded-xl border border-black p-6 dark:border-white">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No authors are available yet.
      </p>
    </div>
  ) : (
    <div className="hide-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3">
      {data.popularAuthors.slice(0, 3).map(
        (author) => (
          <Link
            key={author._id}
            href={`/profile/${author._id}`}
            className="flex min-w-[100px] snap-start flex-col items-center text-center transition-opacity hover:opacity-70"
          >
            {author.profileImage ? (
              <img
                src={author.profileImage}
                alt={author.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-black text-xl font-semibold dark:border-white">
                {author.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <span className="mt-3 max-w-[100px] truncate text-sm font-medium">
              {author.name}
            </span>
          </Link>
        )
      )}
    </div>
  )}
</section>

      </div>
    </main>
  );
}