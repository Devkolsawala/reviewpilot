/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // googleapis is an optional runtime dependency — don't bundle it, require at runtime if available
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
