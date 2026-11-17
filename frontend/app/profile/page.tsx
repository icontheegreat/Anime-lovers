import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import Profile from '../../components/Profile';
import Saved from '../../components/Saved';

export default function Page() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pb-24 pt-16 text-black dark:bg-black dark:text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 sm:px-10">
          <Profile />

          <section className="rounded-2xl border border-black/10 p-5 sm:p-8 dark:border-white/10">
            <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold text-black dark:text-white">
                  Saved Posts
                </h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Posts you have bookmarked across the feed.
                </p>
              </div>
            </div>

            <Saved />
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}