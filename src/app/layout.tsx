import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://epub-translator-yc1l-ddh3.onrender.com'),
  title: {
    default: 'Free EPUB Translator - Convert eBooks to Any Language',
    template: '%s | Free EPUB Translator'
  },
  description: 'Free online EPUB translator that preserves formatting. Instantly translate your eBooks to many languages including French, Spanish, German, Portuguese, and Italian. No sign-up required.',
  keywords: ['epub translator', 'ebook translator', 'book translation', 'free epub converter', 'translate books online', 'epub to french', 'epub to spanish', 'epub to german', 'ebook translation software', 'multilingual ebook converter'],
  authors: [{ name: 'EPUB Translator' }],
  creator: 'EPUB Translator',
  publisher: 'EPUB Translator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/epub-translator.svg',
    shortcut: '/epub-translator.svg',
    apple: '/epub-translator.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://epub-translator-yc1l-ddh3.onrender.com',
    title: 'EPUB Book Translator',
    description: 'Instantly translate your EPUB books to many languages for FREE!',
    siteName: 'EPUB Translator',
    images: [
      {
        url: 'https://epub-translator-yc1l-ddh3.onrender.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EPUB Translator - Free eBook Translation Tool',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EPUB Book Translator',
    description: 'Instantly translate your EPUB books to many languages for FREE!',
    site: '@epubtranslator',
    creator: '@epubtranslator',
    images: ['https://epub-translator-yc1l-ddh3.onrender.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://epub-translator-yc1l-ddh3.onrender.com',
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
  verification: {
    google: 'google-site-verification',
    yandex: 'yandex-verification',
    yahoo: 'yahoo-verification',
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
        <link rel="canonical" href="https://epub-translator-yc1l-ddh3.onrender.com" />
      </head>
      <body className={`${inter.className} h-full antialiased bg-gradient-to-b from-teal-950 via-black to-black overflow-x-hidden`}>
        <main className="min-h-screen w-full flex sm:items-center sm:justify-center">
          {children}
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'EPUB Translator',
              url: 'https://epub-translator-yc1l-ddh3.onrender.com',
              description: 'Instantly translate your EPUB books to many languages for FREE!',
              applicationCategory: 'UtilityApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              },
              featureList: [
                'Support for languages including French, Spanish, German, Italian, and many more',
                'Preserve original EPUB formatting and structure'
              ]
            })
          }}
        />
      </body>
    </html>
  )
}
