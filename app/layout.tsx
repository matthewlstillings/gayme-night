import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Barlow_Condensed, Literata } from 'next/font/google';
import './globals.css';

const serif = Literata({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-serif' });
const sans = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-sans' });
const cond = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-cond' });

export const metadata: Metadata = {
  title: { default: 'gayme night.', template: '%s · gayme night.' },
  description: 'Rulebooks and quick guides for our game nights.',
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: '#0f1420', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${cond.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
