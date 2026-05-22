/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // googleapis is an optional runtime dependency — don't bundle it, require at runtime if available.
      // google-play-scraper is bundled with `got`/`keyv`, which uses dynamic require()s that webpack
      // warns about ("Critical dependency: the request of a dependency is an expression"). Externalize
      // it so it loads at runtime via Node's resolver, matching the googleapis pattern.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "googleapis",
        "google-play-scraper",
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
