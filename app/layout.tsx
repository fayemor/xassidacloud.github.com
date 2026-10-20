import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

import ChatWidget from "./components/ChatWidget";
import PwaRegister from "./components/PwaRegister";
import PageTransition from "./components/PageTransition";
import XassidaIntro from './components/XassidaIntro';
import XassidaIntroScript from './components/XassidaIntroScript';
import { siteUrl, SITE_NAME } from "./lib/catalog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Xassida Cloud - Patrimoine & Sagesse",
  description:
    "Plateforme numérique dédiée à l'œuvre de Cheikh Ahmadou Bamba.",
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: "Xassida Cloud - Patrimoine & Sagesse",
    description:
      "Plateforme numérique dédiée à l'œuvre de Cheikh Ahmadou Bamba.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Xassida Cloud - la bibliothèque numérique du patrimoine mouride",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xassida Cloud - Patrimoine & Sagesse",
    description:
      "Plateforme numérique dédiée à l'œuvre de Cheikh Ahmadou Bamba.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F3D2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <XassidaIntroScript />
      </head>

      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <XassidaIntro />
        <PageTransition>{children}</PageTransition>
        <ChatWidget />
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}
