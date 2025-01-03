import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EPUB Translator',
  description: 'Free online EPUB translator that preserves formatting',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-gradient-to-b from-teal-950 via-black to-black`}>
        <main className="h-full flex items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  )
}
