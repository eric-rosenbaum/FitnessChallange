export default function SpectatorBanner() {
  return (
    <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 text-blue-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="font-semibold">You are a spectator</span>
      </div>
      <p className="text-sm text-blue-700 mt-1 ml-7">
        You can view group activity but cannot log exercises or contribute to group goals.
      </p>
    </div>
  )
}
