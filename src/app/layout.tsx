// ─────────────────────────────────────────────────────────────────────────
// FAVICON / APP ICON — Variant C "White on Lilac" static files
//
//   public/favicon.svg          Master vector (primary, SVG)
//   public/favicon.ico          Multi-resolution .ico (16/32/48)
//   public/favicon-16.png       16×16 PNG
//   public/favicon-32.png       32×32 PNG
//   public/apple-touch-icon.png 180×180 iOS home screen
//   public/favicon-512.png      PWA / Android
//
//   src/app/favicon.ico         Next.js file convention (browser tab fallback)
//   src/app/icon.png            32×32 – Next.js file convention
//   src/app/apple-icon.png      180×180 – Next.js file convention
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
  metadataBase: new URL("https://reviewpilot.co.in"),
  title: {
    default:
      "ReviewPilot — AI Review Management for Play Store, Google & WhatsApp",
    template: "%s | ReviewPilot",
  },
  description:
    "AI-powered review management for India. Automate Play Store reviews, Google Business Profile reviews, and WhatsApp Business messages in one unified inbox. From $16/mo.",
  keywords: [
    "review management software india",
    "ai review reply",
    "unified review inbox",
    "whatsapp business automation",
    "ai whatsapp reply",
    "play store review management",
    "google business profile review management",
    "gmb review reply automation",
    "whatsapp cloud api",
    "embedded signup whatsapp",
    "birdeye alternative india",
    "appfollow alternative",
  ],
  authors: [{ name: "ReviewPilot" }],
  creator: "ReviewPilot",
  publisher: "ReviewPilot",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://reviewpilot.co.in",
    siteName: "ReviewPilot",
    title:
      "ReviewPilot — AI Review Management for Play Store, Google & WhatsApp",
    description:
      "Automate Play Store reviews, Google Business Profile reviews, and WhatsApp Business messages with AI. One unified inbox. Built for India.",
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
    title:
      "ReviewPilot — AI Review Management for Play Store, Google & WhatsApp",
    description:
      "AI replies for Play Store, Google, and WhatsApp Business — one unified inbox. From $16/mo.",
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
