/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://reviewpilot.co.in',
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
      // Free tools
      '/tools/play-store-character-counter': 0.8,
      '/tools/ai-review-reply-generator': 0.8,
      '/tools/app-rating-calculator': { priority: 0.9, changefreq: 'monthly' },
      '/tools/play-store-analyzer': 0.85,
      // Other
      '/about': 0.7,
      '/demo': 0.8,
      '/blog': 0.8,
      '/play-store-reviews-guide': { priority: 1.0, changefreq: 'monthly' },
      // Phase 2 SEO blog posts
      '/blog/play-store-review-response-examples-2026': 0.7,
      '/blog/how-to-get-more-5-star-reviews-google-play-store': 0.7,
      '/blog/appfollow-alternatives-for-indie-developers-2026': 0.8,
      '/blog/best-chatgpt-prompts-for-play-store-review-replies': 0.7,
      '/blog/how-google-play-rating-algorithm-works': 0.7,
      '/blog/app-store-vs-play-store-review-management-differences': 0.7,
      // Phase 2.5 SEO blog posts
      '/blog/play-store-ai-review-summaries-developer-guide-2026': 0.8,
      '/blog/how-to-recover-app-rating-2-stars-to-4-stars': 0.8,
      '/blog/android-in-app-review-api-tutorial-2026': 0.7,
      '/blog/app-review-velocity-ranking-signal-2026': 0.7,
      '/blog/how-to-remove-fake-reviews-play-store-2026': 0.7,
      '/blog/will-google-penalize-ai-generated-replies-play-store': 0.8,
      // Phase 2.6 SEO blog posts
      '/blog/play-store-aso-ranking-factors-2026-reviews-impact': { priority: 0.9, changefreq: 'monthly' },
      '/blog/1-star-reviews-after-app-update-recovery-playbook': { priority: 0.8, changefreq: 'monthly' },
      '/blog/multi-language-play-store-reply-strategy-localized-ai': { priority: 0.7, changefreq: 'monthly' },
      '/blog/indie-app-developer-review-management-workflow-2026': { priority: 0.7, changefreq: 'monthly' },
      '/blog/how-app-reviews-affect-install-conversion-rate-data-study': { priority: 0.8, changefreq: 'monthly' },
      '/blog/google-play-console-permissions-reply-reviews-guide': { priority: 0.7, changefreq: 'monthly' },
      // Phase 2.7 SEO blog posts
      '/blog/generative-engine-optimization-for-apps-and-saas-2026': { priority: 0.9, changefreq: 'monthly' },
      '/blog/how-to-reply-to-hinglish-and-indian-language-play-store-reviews': { priority: 0.8, changefreq: 'monthly' },
      '/blog/best-free-ai-tools-to-reply-to-app-reviews-2026-comparison': { priority: 0.9, changefreq: 'monthly' },
      '/blog/psychology-of-1-star-app-reviews-what-users-really-mean': { priority: 0.8, changefreq: 'monthly' },
      '/blog/how-to-ask-for-app-reviews-without-violating-google-policies-2026': { priority: 0.7, changefreq: 'monthly' },
      '/blog/competitive-review-analysis-how-to-mine-competitor-app-reviews-in-2026': { priority: 0.7, changefreq: 'monthly' },
    };

    const pathConfig = priorities[path];

    const changefreq =
      typeof pathConfig === 'object'
        ? pathConfig.changefreq
        : path.startsWith('/blog/')
          ? 'monthly'
          : path.startsWith('/tools/')
            ? 'weekly'
            : config.changefreq;

    return {
      loc: path,
      changefreq,
      priority:
        typeof pathConfig === 'object'
          ? pathConfig.priority
          : pathConfig ?? config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
