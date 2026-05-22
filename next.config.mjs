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
    ];
  },
};

export default nextConfig;
