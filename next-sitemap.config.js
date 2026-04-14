/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.reviewpilot.co.in',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [
    '/dashboard',
    '/dashboard/*',
    '/api/*',
    '/auth/*',
    '/login',
    '/signup',
    '/review-page/*',
    '/_not-found',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api/',
          '/auth/',
          '/login',
          '/signup',
          '/review-page/',
        ],
      },
    ],
  },
  // Custom priority per path
  transform: async (config, path) => {
    const priorities = {
      '/': 1.0,
      '/pricing': 0.9,
      '/how-it-works': 0.9,
      '/features/google-play-reviews': 0.9,
      '/features/google-business-profile': 0.9,
      '/for-local-business': 0.8,
      '/for-app-developers': 0.8,
      '/alternatives/birdeye-alternative': 0.8,
      '/compare/reviewpilot-vs-birdeye': 0.8,
      '/compare/reviewpilot-vs-famepilot': 0.7,
      '/compare/reviewpilot-vs-podium': 0.7,
      '/compare/reviewpilot-vs-simplify360': 0.7,
      '/about': 0.7,
      '/demo': 0.8,
      '/blog': 0.8,
    };

    return {
      loc: path,
      changefreq: path.startsWith('/blog/') ? 'monthly' : config.changefreq,
      priority: priorities[path] ?? config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
