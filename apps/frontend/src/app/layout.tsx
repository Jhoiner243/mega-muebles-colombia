import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'Mega Muebles - Hogar y Remodelación',
  description: 'Tienda online especializada en muebles, espejos, baños, cocinas y productos para el hogar. Envío rápido y productos de calidad.',
  keywords: 'muebles, espejos, baños, cocinas, hogar, remodelación, Colombia',
  authors: [{ name: 'Mega Muebles' }],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://megamuebles.com',
    siteName: 'Mega Muebles',
    title: 'Mega Muebles - Hogar y Remodelación',
    description: 'Tienda online especializada en muebles, espejos, baños, cocinas y productos para el hogar.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mega Muebles - Hogar y Remodelación',
    description: 'Tienda online especializada en muebles, espejos, baños, cocinas y productos para el hogar.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
