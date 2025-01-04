import React from 'react';

export function StaticContent() {
  return (
    <>
      {/* SEO-friendly static content */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        EPUB Book Translator
      </h1>
      <div className="prose prose-invert max-w-none mb-4">
        <p className="text-gray-300 text-xs sm:text-base">
          Instantly translate your EPUB books to many languages for FREE!
        </p>
        <div className="mt-4 space-y-1">
          <h2 className="text-md sm:text-lg font-semibold text-white">Features:</h2>
          <ul className="list-disc pl-4 text-gray-300 text-xs sm:text-sm">
            <li className='mb-2'>Support for languages including French, Spanish, German, Italian, and many more</li>
            <li>Preserve original EPUB formatting and structure</li>
          </ul>
        </div>
      </div>
    </>
  );
}