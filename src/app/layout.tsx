import type { Metadata } from 'next';
import { Jost } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MascotClientMount from '@/components/mascot/MascotClientMount';

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jost',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ByteBank | Digital Asset & Transaction Management System',
  description: 'Production-grade DBMS project featuring real PostgreSQL 16 ACID transactions, double-entry ledger bookkeeping, and rule-based risk screening.',
  icons: {
    icon: '/bytebank-icon.svg',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jost.variable}>
      <body className={`${jost.className} min-h-screen flex flex-col bg-white text-[#2B2F4A] antialiased selection:bg-[#0B4FFF] selection:text-white`}>
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <MascotClientMount />
      </body>
    </html>
  );
}
