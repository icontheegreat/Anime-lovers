import './globals.css';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import WelcomeModal from '../components/WelcomeModal';

export const metadata = {
  title: 'Anime BY Icon',
  description: 'Anime post feed.',
};

const themeScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="bg-white text-black dark:bg-black dark:text-white transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />

        <WelcomeModal />

        <Header />

        <div className="app-content">
          {children}
        </div>

        <BottomNav />
      </body>
    </html>
  );
}