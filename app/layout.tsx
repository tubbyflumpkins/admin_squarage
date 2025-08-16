import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const neueHaas = localFont({
  src: [
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayXXThin.ttf', weight: '100' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayXThin.ttf', weight: '200' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayThin.ttf', weight: '300' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayLight.ttf', weight: '400' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayRoman.ttf', weight: '500' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayMediu.ttf', weight: '600' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayBold.ttf', weight: '700' },
    { path: '../Style/fonts/neue-haas-grotesk-display-pro-cufonfonts/NeueHaasDisplayBlack.ttf', weight: '900' },
  ],
  variable: '--font-neue-haas',
  display: 'swap',
})

const soap = localFont({
  src: '../Style/fonts/Soap Regular.ttf',
  variable: '--font-soap',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Squarage Admin Dashboard',
  description: 'Admin dashboard for Squarage operations',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${neueHaas.variable} ${soap.variable}`}>
      <body className="font-neue-haas bg-squarage-green min-h-screen">
        {children}
      </body>
    </html>
  )
}