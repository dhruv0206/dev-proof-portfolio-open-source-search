import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const siteUrl = "https://orenda.vision";

export const metadata: Metadata = {
  title: {
    default: "DevProof | Prove Your Code. Build Your Credibility.",
    template: "%s | DevProof",
  },
  description: "AI-powered platform to discover open source issues, verify your contributions, and build a verified developer portfolio. Ship. Verify. Showcase.",
  keywords: ["github", "open source", "contribution", "developer portfolio", "verified contributions", "good first issue", "help wanted", "beginner friendly", "proof of work", "developer proof"],
  authors: [{ name: "Dhruv" }],
  creator: "Dhruv",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DevProof | Prove Your Code. Build Your Credibility.",
    description: "AI-powered platform to discover open source issues, verify your contributions, and build a verified developer portfolio.",
    url: siteUrl,
    siteName: "DevProof",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevProof",
    description: "AI-powered platform to discover open source issues, verify your contributions, and build a verified developer portfolio.",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DevProof",
    "description": "AI-powered platform to discover open source issues, verify your contributions, and build a verified developer portfolio",
    "url": "https://orenda.vision",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Dhruv"
    }
  };

  return (
    <html lang="en" className={`dark ${GeistSans.className}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <style>{`:root { --font-geist-mono: ${GeistMono.style.fontFamily}; }`}</style>
      </head>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
