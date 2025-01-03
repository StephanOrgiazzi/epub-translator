import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://epub-translator.onrender.com'),
  title: {
    default: 'Free EPUB Translator - Convert eBooks to Any Language',
    template: '%s | Free EPUB Translator'
  },
  description: 'Free online EPUB translator that preserves formatting. Instantly translate your eBooks to 95+ languages including French, Spanish, German, Chinese, and Japanese. No sign-up required.',
  keywords: 'epub translator, ebook translator, book translation, free epub converter, translate books online, epub to french, epub to spanish, epub to german, ebook translation software, multilingual ebook converter',
  authors: [{ name: 'EPUB Translator' }],
  creator: 'EPUB Translator',
  publisher: 'EPUB Translator',
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
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/epub-translator.svg',
    shortcut: '/epub-translator.svg',
    apple: '/epub-translator.svg',
  },
  openGraph: {
    title: 'Free EPUB Translator - Convert eBooks to Any Language',
    description: 'Free online EPUB translator that preserves formatting. Instantly translate your eBooks to 95+ languages. No sign-up required.',
    url: 'https://epub-translator.onrender.com',
    siteName: 'EPUB Translator',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EPUB Translator - Free eBook Translation Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free EPUB Translator - Convert eBooks to Any Language',
    description: 'Free online EPUB translator that preserves formatting. Instantly translate your eBooks to 95+ languages. No sign-up required.',
    images: ['/og-image.png'],
    creator: '@epubtranslator',
  },
  verification: {
    google: 'your-google-site-verification', // You'll need to add your actual verification code
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} h-full antialiased bg-gradient-to-b from-teal-950 via-black to-black`}>
        <main className="h-full flex items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  )
}
