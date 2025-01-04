import React from 'react';

export function StaticContent() {
  return (
    <>
      {/* SEO-friendly static content */}
      <h1 className="text-2xl font-bold text-white mb-2">
        EPUB Book Translator
      </h1>
      <div className="prose prose-invert max-w-none mb-4">
        <p className="text-gray-300 text-sm mb-2">
          Instantly translate your EPUB ebooks to many languages for FREE.
        </p>
        <p className="text-gray-300 text-sm hidden sm:block">Support for languages including Spanish, German, Portuguese, French, Italian, Swedish, and many more!</p>
      </div>
    </>
  );
}
