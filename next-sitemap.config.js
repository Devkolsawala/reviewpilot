// Shared with the runtime quality gate (src/lib/seo/insights-quality-gate.ts)
// so the build-time sitemap query and the per-page robots decision use the same
// thresholds and can never silently drift.
const { INSIGHTS_GATE } = require('./src/lib/seo/insights-gate-constants');

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
  // Per-app /insights report URLs. The route is force-dynamic with no static
  // params, so next-sitemap can't discover it — we enumerate the indexable set
  // here. Only gated + live rows are emitted; thin/expired/clusteringFailed rows
  // are never advertised (the page's own robots meta stays authoritative either
  // way). lastmod = scraped_at to advertise honest freshness.
  additionalPaths: async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('[next-sitemap] Supabase env missing; skipping /insights pages');
      return [];
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from('public_app_analyses')
      .select('package_id, rating, rating_count, analysis, scraped_at')
      .gt('expires_at', new Date().toISOString())
      .not('analysis', 'is', null)
      .limit(5000);

    if (error || !data) {
      console.warn(
        '[next-sitemap] /insights query failed; skipping',
        error && error.message
      );
      return [];
    }

    // Mirrors passesInsightsQualityGate. Thresholds come from the shared
    // INSIGHTS_GATE module (cannot drift); the boolean checks (rating > 0,
    // !clusteringFailed) mirror the gate predicate.
    return data
      .filter((row) => {
        const a = row.analysis;
        if (!a || a.clusteringFailed) return false;
        const themeCount =
          ((a.complaints && a.complaints.length) || 0) +
          ((a.praises && a.praises.length) || 0);
        return (
          Number(row.rating) > 0 &&
          (Number(row.rating_count) || 0) >= INSIGHTS_GATE.minRatingCount &&
          (Number(a.reviewCount) || 0) >= INSIGHTS_GATE.minReviewCount &&
          themeCount >= INSIGHTS_GATE.minThemeCount
        );
      })
      .map((row) => ({
        loc: `/insights/${row.package_id}`,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date(row.scraped_at).toISOString(),
      }));
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
      // Insights hub (per-app report URLs are added via additionalPaths below)
      '/insights': 0.7,
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
      // Version Impact Analyzer launch post
      '/blog/app-update-hurt-play-store-rating': { priority: 0.8, changefreq: 'monthly' },
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
