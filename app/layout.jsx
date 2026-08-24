import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.scss';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'SRKR x ToriiMinds | Gateway to Tech Excellence',
  description: 'ToriiMinds and SRKR Engineering College collaboration programs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${outfit.variable}`}>
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}

