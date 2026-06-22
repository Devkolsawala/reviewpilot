/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // googleapis is an optional runtime dependency — don't bundle it, require at runtime if available.
      //
      // NOTE: google-play-scraper@10+ is ESM-only and was previously listed
      // here to suppress a webpack warning from its `keyv`/`got@11` chain.
      // Externalizing forced a runtime require() of an ESM module, which
      // crashed every API route invocation with ERR_REQUIRE_ESM on Vercel.
      // It's now lazy-imported inside src/lib/analyzer/play-store-scraper.ts,
      // so it must NOT be externalized — Node's native ESM loader handles it
      // at the first dynamic import. The keyv "Critical dependency" warning
      // is back as a build-time noise; address separately if needed.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "googleapis",
      ];
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.reviewpilot.co.in' }],
        destination: 'https://reviewpilot.co.in/:path*',
        permanent: true,
      },
      // Consolidate "Birdeye alternative" SEO equity onto /vs/birdeye
      {
        source: "/alternatives/birdeye-alternative",
        destination: "/vs/birdeye",
        permanent: true,
      },
      {
        source: "/compare/reviewpilot-vs-birdeye",
        destination: "/vs/birdeye",
        permanent: true,
      },
      // Blog consolidation: 7 cannibalizing posts redirected to their canonical.
      // Source files/registry entries are preserved on disk (content merged in).
      {
        source: "/blog/how-ai-review-replies-improve-google-maps-ranking",
        destination: "/blog/ai-review-replies-google-maps-ranking-2026",
        permanent: true,
      },
      {
        source: "/blog/review-velocity-app-store-ranking-india",
        destination: "/blog/app-review-velocity-ranking-signal-2026",
        permanent: true,
      },
      {
        source: "/blog/appfollow-alternative",
        destination: "/blog/appfollow-alternatives-for-indie-developers-2026",
        permanent: true,
      },
      {
        source: "/blog/play-store-rating-below-4-stars-recovery-plan",
        destination: "/blog/how-to-recover-app-rating-2-stars-to-4-stars",
        permanent: true,
      },
      {
        source: "/blog/how-to-analyze-competitor-play-store-reviews",
        destination: "/blog/competitive-review-analysis-how-to-mine-competitor-app-reviews-in-2026",
        permanent: true,
      },
      {
        source: "/blog/ai-sentiment-analysis-app-reviews",
        destination: "/blog/how-to-read-app-review-sentiment-analysis",
        permanent: true,
      },
      {
        source: "/blog/how-to-get-more-google-reviews-local-business",
        destination: "/blog/how-to-get-more-google-reviews-2026",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
