import type { Metadata, Viewport } from "next"
import Link from "next/link"

import "./globals.css"

export const metadata: Metadata = {
  title: "Korean SRS",
  description: "Minimal Korean revision website powered by Supabase."
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <Link className="brand" href="/">
              Korean SRS
            </Link>
          </header>
          <main>{children}</main>
          <footer className="footer">
            <span className="mono">cards</span> come from Supabase · deploy on Vercel
          </footer>
        </div>
      </body>
    </html>
  )
}
