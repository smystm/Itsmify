import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google"
import "./globals.css"
import { AnimateUIProvider } from "@animate-ui/react/provider"
import { ThemeProvider, themeInitScript } from "./components/ThemeProvider"
import { fa } from "@/lib/i18n/fa"

const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"],
})

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"],
})

const vazirmatn = Vazirmatn({
   variable: "--font-vazirmatn",
   // "arabic" is required — "latin" alone never loads Persian glyphs.
   subsets: ["arabic", "latin"],
})

export const metadata: Metadata = {
   title: {
      default: fa.brand,
      template: `%s | ${fa.brand}`,
   },
   description: fa.landing.metaDescription,
}

export const viewport: Viewport = {
   width: "device-width",
   initialScale: 1,
   // Matches the page background so mobile browser chrome blends in.
   themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#f7fafc" },
      { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
   ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
   return (
      <html lang="fa" dir="rtl" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}>
         <head>
            {/* Runs before paint so dark-mode visitors never see a white flash. */}
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
         </head>
         <body className="min-h-full flex flex-col font-vazirmatn">
            <ThemeProvider>
              <AnimateUIProvider tempo={1.05} reducedMotion="user">{children}</AnimateUIProvider>
            </ThemeProvider>
         </body>
      </html>
   )
}
