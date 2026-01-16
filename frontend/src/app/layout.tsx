import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const siteUrl = "https://opensource-search.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "GitHub Contribution Finder | Find Open Source Issues to Contribute",
    template: "%s | GitHub Contribution Finder",
  },
  description: "AI-powered search engine to discover 100K+ beginner-friendly open source issues on GitHub. Find good first issues, help wanted, and beginner-friendly contributions today.",
  keywords: ["github", "open source", "contribution", "issues", "good first issue", "help wanted", "beginner friendly", "first contribution", "open source projects", "github issues"],
  authors: [{ name: "Dhruv" }],
  creator: "Dhruv",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GitHub Contribution Finder | Find Open Source Issues",
    description: "AI-powered search engine to discover 100K+ beginner-friendly open source issues on GitHub. Start contributing today!",
    url: siteUrl,
    siteName: "GitHub Contribution Finder",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Contribution Finder",
    description: "AI-powered search engine to discover 100K+ beginner-friendly open source issues on GitHub.",
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
    "name": "GitHub Contribution Finder",
    "description": "AI-powered search engine to discover 100K+ beginner-friendly open source issues on GitHub",
    "url": "https://opensource-search.vercel.app",
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body suppressHydrationWarning>
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}

