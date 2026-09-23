import type { Metadata } from 'next';
import { Fraunces, Public_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/ui/BottomNav';
import Preloader from '@/components/ui/Preloader';

const fraunces = Fraunces({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const publicSans = Public_Sans({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Yathra Care - Passenger Grievance Reporting System',
  description: 'Offline-first passenger grievance registration and depot SLA management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className={`${publicSans.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col pb-16 md:pb-0`}>
        <Preloader />
        <Header />
        <main className="flex-1 w-full">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mb-14 md:mb-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <strong className="text-slate-700">Yathra Care Grievance Portal</strong> — Offline SQLite Operations Engine
            </div>
            <div>
              Status: <span className="text-emerald-600 font-bold">● Local System Ready</span> (No External Cloud Needed)
            </div>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
