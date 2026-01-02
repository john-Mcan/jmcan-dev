import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { personal } from "@/data/personal";
import { FAVICON_SVG_PATH, OG_IMAGE_PATH, SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "John Moya Cantillana | Desarrollador Full Stack",
    template: "%s | John Moya Cantillana",
  },
  description:
    "Portfolio de John Moya Cantillana. Desarrollador Full Stack especializado en Next.js, React y TypeScript. Diseño, construyo y despliego aplicaciones web listas para producción.",
  keywords: [
    "portfolio",
    "portafolio",
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
  icons: {
    icon: [
      { url: FAVICON_SVG_PATH, type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: [{ url: FAVICON_SVG_PATH, type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: OG_IMAGE_PATH }],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: "en_US",
    url: SITE_URL,
    siteName: "John Moya Cantillana",
    title: "John Moya Cantillana | Desarrollador Full Stack",
    description:
      "Desarrollador Full Stack especializado en Next.js, React y TypeScript.",
    images: [
      {
        url: OG_IMAGE_PATH,
        alt: `${personal.name} — Portfolio`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "John Moya Cantillana | Desarrollador Full Stack",
    description:
      "Desarrollador Full Stack especializado en Next.js, React y TypeScript.",
    images: [OG_IMAGE_PATH],
    creator: "@johnmcan",
    site: "@johnmcan",
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
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: personal.name,
        description: metadata.description,
        inLanguage: ["es", "en"],
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: personal.name,
        url: SITE_URL,
        jobTitle: personal.title,
        email: `mailto:${personal.email}`,
        sameAs: [
          personal.social.github,
          personal.social.linkedin,
          personal.social.twitter,
        ],
        image: new URL(OG_IMAGE_PATH, SITE_URL).toString(),
      },
    ],
  } as const;

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
