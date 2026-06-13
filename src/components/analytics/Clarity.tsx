"use client";

import Script from "next/script";

/**
 * Microsoft Clarity — heatmaps + session recordings, loaded site-wide.
 *
 * Renders NOTHING unless BOTH conditions hold:
 *   1. NEXT_PUBLIC_CLARITY_PROJECT_ID is set, and
 *   2. this is a production build (process.env.NODE_ENV === "production").
 *
 * This keeps local dev clean (NODE_ENV is "development" there). To also keep
 * Vercel *preview* deploys clean — where NODE_ENV is "production" too — set
 * NEXT_PUBLIC_CLARITY_PROJECT_ID ONLY in Vercel's Production environment, not
 * Preview; with the var unset, this component returns null on preview.
 *
 * Uses next/script with strategy="afterInteractive" (matching the GA4 pattern
 * in the root layout) so the tag loads after hydration and never blocks render
 * or hurts Core Web Vitals. The project id is read from the env var and
 * interpolated into the official Clarity bootstrap — never hardcoded.
 */
export function Clarity() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (process.env.NODE_ENV !== "production" || !projectId) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
