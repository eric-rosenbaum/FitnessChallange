'use client'

interface LoadingSpinnerProps {
  fullScreen?: boolean
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
  const text = 'FriendsFitnessChallenge'
  const letters = text.split('')

  const content = (
    <div className="glass-card rounded-2xl soft-shadow-lg p-8 sm:p-12 border border-red-100/30">
      <div className="flex flex-col items-center justify-center">
        {/* Animated text with wave effect */}
        <div className="flex items-center justify-center mb-8 flex-wrap gap-0.5 sm:gap-1">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="text-lg sm:text-2xl md:text-3xl font-bold text-[#8B4513] inline-block letter-pulse"
              style={{
                animationDelay: `${index * 0.08}s`,
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
        
        {/* Animated dots with staggered bounce */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#8B4513] opacity-70 dot-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return content
}
