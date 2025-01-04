export default function Loading() {
  return (
    <div className="w-full max-w-2xl mx-4 relative">
      <div className="relative backdrop-blur-lg bg-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 min-h-[400px]">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-10 bg-gray-700/50 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-700/50 rounded w-2/3 mx-auto"></div>
          </div>
          
          {/* Features skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-700/50 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-700/50 rounded w-5/6"></div>
              ))}
            </div>
          </div>
          
          {/* How to use skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-700/50 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-700/50 rounded w-3/4"></div>
              ))}
            </div>
          </div>
          
          {/* Uploader area skeleton */}
          <div className="h-32 bg-gray-700/50 rounded mt-8"></div>
        </div>
      </div>
    </div>
  )
}
