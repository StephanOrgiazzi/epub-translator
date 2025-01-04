'use client'

import dynamic from 'next/dynamic'
import { StaticContent } from '../components/StaticContent'

// Client component loaded dynamically
const EpubUploader = dynamic(() => import('../components/EpubUploader'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700/50 rounded w-64 mx-auto mb-4"></div>
      <div className="h-32 bg-gray-700/50 rounded"></div>
    </div>
  ),
})

export default function Home() {
  return (
    <div className="w-full max-w-2xl px-4 flex-1">
      {/* Background blur circles for visual interest */}
      <div className="fixed -top-20 -left-20 w-72 h-72 bg-emerald-700 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
      <div className="fixed top-60 -right-20 w-72 h-72 bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob [animation-delay:2s]"></div>

      {/* Main container with glassmorphism effect */}
      <div className="relative backdrop-blur-lg bg-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 mt-4 sm:mt-0">
        <div className="space-y-6">
          {/* Server-rendered static content */}
          <StaticContent />
          
          {/* Client-rendered interactive uploader */}
          <div className="mt-8">
            <EpubUploader targetLanguage="fr" />
          </div>
        </div>
      </div>
    </div>
  )
}