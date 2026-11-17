import Link from 'next/link';
import Header from '../../../components/Header';
import BottomNav from '../../../components/BottomNav';
import Saved from '../../../components/Saved';

export default function SavedPostsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-4xl px-5 pb-32 pt-24">
        <div className="mb-8 flex items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-semibold">Saved Posts</h1>
            <p className="mt-1 text-sm text-neutral-500">
              All posts you have bookmarked across the platform.
            </p>
          </div>

          <Link
            href="/profile"
            className="rounded-full border px-4 py-2 text-sm transition-opacity hover:opacity-75"
          >
            ← Profile
          </Link>
        </div>

        <Saved />
      </main>
      <BottomNav />
    </>
  );
}