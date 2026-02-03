import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

export const metadata: Metadata = {
  title: 'FriendsFitnessChallenge',
  description: 'Weekly fitness challenges for your group',
  icons: {
    icon: [
      { url: '/icon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon.ico',
    apple: '/icon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
