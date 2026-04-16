import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PublicLayoutWrapper from '@/components/layout/PublicLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MerryStory Productions',
  description: 'Your Story, Spectacularly Told.',
  icons: {
    icon: '/MerryStoryLogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}