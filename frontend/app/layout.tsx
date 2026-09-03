import './globals.css';

import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'Anime Visual Posts',
  description: 'A minimal visual anime post feed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="pb-20">
        {children}

        <BottomNav />
      </body>
    </html>
  );
}