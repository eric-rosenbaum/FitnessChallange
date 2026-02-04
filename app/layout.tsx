import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Reset zoom on page load/navigation
              (function() {
                // Reset zoom on page load
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', resetZoom);
                } else {
                  resetZoom();
                }
                
                // Reset zoom when navigating back (from cache)
                window.addEventListener('pageshow', function(event) {
                  if (event.persisted) {
                    setTimeout(resetZoom, 0);
                  }
                });
                
                // Reset zoom on route change (Next.js)
                window.addEventListener('popstate', function() {
                  setTimeout(resetZoom, 0);
                });
                
                function resetZoom() {
                  // Force viewport reset
                  const meta = document.querySelector('meta[name="viewport"]');
                  if (meta) {
                    const content = meta.getAttribute('content') || '';
                    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                    // Trigger reflow
                    void meta.offsetHeight;
                  }
                  
                  // Reset body zoom if supported
                  if (document.body.style.zoom !== undefined) {
                    document.body.style.zoom = '1';
                  }
                  
                  // Scroll to top to ensure viewport is reset
                  if (window.scrollY > 0) {
                    window.scrollTo(0, 0);
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
