import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppIntlProvider } from "@/components/providers/intl-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://johnmcan.dev"),
  title: {
    default: "John Moya Cantillana | Desarrollador Full Stack",
    template: "%s | John Moya Cantillana",
  },
  description:
    "Desarrollador Full Stack especializado en Next.js, React y TypeScript. Constructor de plataformas web escalables con más de 32,000 usuarios.",
  keywords: [
    "desarrollador full stack",
    "full stack developer",
    "next.js",
    "react",
    "typescript",
    "postgresql",
    "supabase",
    "vercel",
  ],
  authors: [{ name: "John Moya Cantillana" }],
  creator: "John Moya Cantillana",
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: "en_US",
    url: "https://johnmcan.dev",
    siteName: "John Moya Cantillana",
    title: "John Moya Cantillana | Desarrollador Full Stack",
    description:
      "Desarrollador Full Stack especializado en Next.js, React y TypeScript.",
  },
  twitter: {
    card: "summary_large_image",
    title: "John Moya Cantillana | Desarrollador Full Stack",
    description:
      "Desarrollador Full Stack especializado en Next.js, React y TypeScript.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="dark"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Script
          id="prefs-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jmcan:theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}else if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}var l=localStorage.getItem('jmcan:locale');if(l==='en'||l==='es'){document.documentElement.lang=l;}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <AppIntlProvider>
            <Header />
            <main className="flex-1 pb-12 md:pb-16">{children}</main>
            <Footer />
          </AppIntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
