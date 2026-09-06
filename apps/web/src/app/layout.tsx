import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuickRoleSwitcher } from '@/components/QuickRoleSwitcher';

export const metadata: Metadata = {
  title: 'ParkEase - Find. Book. Park. Smart Parking Platform',
  description: 'Reserve real-time verified parking slots before you arrive. Concurrency-safe slot holds, EV charging support, instant QR gate entry, and transparent pricing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <QuickRoleSwitcher />
      </body>
    </html>
  );
}
