import type { Metadata } from "next"
import { Archivo_Black, Space_Grotesk, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
})

const plexMono = IBM_Plex_Mono({
  weight: ["400", "600", "700"],
  variable: "--font-plex-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Campus Market — Buy & Sell on Campus",
  description:
    "Find affordable books, electronics, furniture and more from students around you.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-grotesk">
        {children}
      </body>
    </html>
  )
}