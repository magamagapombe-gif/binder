import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] });
const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm', weight: ['300', '400', '500'] });

export const metadata: Metadata = {
  title: 'Binder — Find Your Match in East Africa',
  description: 'Dating app for Uganda, Kenya and Tanzania',
  themeColor: '#FF4458',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dm.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-[#0D0D0F] text-white antialiased overflow-x-hidden">
        {children}
        <Toaster position="top-center" toastOptions={{ style: { background: '#1A1A1F', color: '#fff', border: '1px solid #2A2A30' } }} />
      </body>
    </html>
  );
}
