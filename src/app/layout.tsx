// ─────────────────────────────────────────────────────────────────────────
// FAVICON / APP ICON — Variant C "White on Lilac" (#6B4DFF).
// Static assets live in src/app/ (Next.js 14 file convention) and public/.
//   src/app/favicon.ico         multi-res .ico (16/32/48)
//   src/app/icon.png            32x32 browser tab
//   src/app/apple-icon.png      180x180 iOS home screen
//   public/favicon.svg          vector master
//   public/favicon-{16,32,64,512}.png  PNG variants for legacy <link>
//   public/apple-touch-icon.png  iOS fallback for crawlers
// To swap, replace the files in place — no code changes needed.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/toaster";
import { SonnerToaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
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

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.reviewpilot.co.in"),
  title: {
    default: "ReviewPilot — AI-Powered Review Management for Apps & Businesses",
    template: "%s | ReviewPilot",
  },
  description:
    "Manage Google Play Store and Google Business reviews with AI-powered auto-replies. Save hours every week. Plans from $16/mo.",
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
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
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

export const viewport: Viewport = {
  themeColor: "#6B4DFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable} ${dmSans.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;var isApp=p.indexOf('/dashboard')===0||p.indexOf('/login')===0||p.indexOf('/signup')===0||p.indexOf('/forgot-password')===0||p.indexOf('/reset-password')===0||p.indexOf('/verified')===0||p.indexOf('/review-page')===0;var dark;if(isApp){var t=localStorage.getItem('theme');dark=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);}else{dark=false;}if(dark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})()`,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V56C4Z5MK2"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V56C4Z5MK2');
          `}
        </Script>
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
        <SonnerToaster />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <Analytics />
      </body>
    </html>
  );
}
