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
    // Redirected to /vs/birdeye — keep out of sitemap so Google focuses on the canonical
    '/alternatives/birdeye-alternative',
    '/compare/reviewpilot-vs-birdeye',
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
      '/features': 0.95,
      '/how-it-works': 0.9,
      // High-value new landing pages
      '/whatsapp-automation': 0.9,
      '/unified-inbox': 0.9,
      // Integration pages
      '/integrations': 0.85,
      '/integrations/whatsapp-business': 0.8,
      '/integrations/google-play-store': 0.8,
      '/integrations/google-business-profile': 0.8,
      // Existing feature deep-dives
      '/features/google-play-reviews': 0.9,
      '/features/google-business-profile': 0.9,
      // Persona pages
      '/for-local-business': 0.8,
      '/for-app-developers': 0.8,
      // Comparison pages
      '/vs/birdeye': 0.7,
      '/vs/appfollow': 0.7,
      '/compare/reviewpilot-vs-famepilot': 0.7,
      '/compare/reviewpilot-vs-podium': 0.7,
      '/compare/reviewpilot-vs-simplify360': 0.7,
      // Other
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
