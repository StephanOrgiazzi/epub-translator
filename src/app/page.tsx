'use client'

import dynamic from 'next/dynamic'

// Dynamically import EpubUploader with no SSR
const EpubUploader = dynamic(() => import('../components/EpubUploader'), {
  ssr: false,
})

export default function Home() {
  return (
    <div className="w-full max-w-2xl mx-4 relative">
      {/* Background blur circles for visual interest */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-700 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
      <div className="absolute top-60 -right-20 w-72 h-72 bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob [animation-delay:2s]"></div>

      {/* Main container with glassmorphism effect */}
      <div className="relative backdrop-blur-lg bg-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 min-h-[400px] flex flex-col">
        <div className="space-y-6 flex-grow">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">EPUB Translator</h2>
            <p className="text-white/80 drop-shadow-md">Translate your EPUB books with ease</p>
          </div>

          <EpubUploader targetLanguage="fr" />
        </div>
      </div>
    </div>
  )
}