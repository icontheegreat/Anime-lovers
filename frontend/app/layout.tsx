import './globals.css';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'Anime Visual Posts',
  description: 'A minimal visual anime post feed.',
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
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />

        <Header />

        <div className="app-content">
          {children}
        </div>

        <BottomNav />
      </body>
    </html>
  );
}