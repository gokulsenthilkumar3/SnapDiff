import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SnapDiff — Visual Regression Testing for Vercel Deployments',
  description:
    'Catch visual bugs before your users do. Automated screenshot diffing for every Vercel deploy and GitHub PR. 97% cheaper than Percy.',
  keywords: ['visual regression', 'screenshot diff', 'Vercel', 'GitHub', 'Percy alternative'],
  openGraph: {
    title: 'SnapDiff',
    description: 'Automated visual regression testing for Vercel + GitHub',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
