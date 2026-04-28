import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DataMind - ML Data Analysis Platform",
  description:
    "A comprehensive machine learning platform for students and academics to analyze datasets and run ML algorithms including Linear Regression, Decision Trees, SVM, Neural Networks, and more.",
  generator: "BY_ACHRAF_EL_BOUMASHOULI",
  icons: {
    icon: [
      {
        url: "/empty.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/empty.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/empty.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/empty.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
