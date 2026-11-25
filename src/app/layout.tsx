import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SP Stock — Enterprise Inventory Platform',
  description: 'SP Stock Enterprise Godown & Plant Inventory Management System — Since 1989',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SP Stock',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-white selection:text-black overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
