import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.reviewpilot.co.in"),
  title: {
    default: "ReviewPilot — AI-Powered Review Management for Apps & Businesses",
    template: "%s | ReviewPilot",
  },
  description:
    "Manage Google Play Store and Google Business reviews with AI-powered auto-replies. Save hours every week. Plans from ₹1,500/mo.",
  keywords: [
    "review management",
    "google play reviews",
    "AI review reply",
    "google business profile",
    "app review management",
    "play store reviews",
    "auto reply reviews",
  ],
  authors: [{ name: "ReviewPilot" }],
  creator: "ReviewPilot",
  publisher: "ReviewPilot",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.reviewpilot.co.in",
    siteName: "ReviewPilot",
    title: "ReviewPilot — AI-Powered Review Management",
    description:
      "Manage Google Play Store and Google Business reviews with AI-powered auto-replies. Save hours every week.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ReviewPilot — AI Review Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot — AI-Powered Review Management",
    description:
      "Manage Google Play Store and Google Business reviews with AI-powered auto-replies.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
