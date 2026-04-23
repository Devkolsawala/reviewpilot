export const SUPPORT_EMAIL = "hello@reviewpilot.co.in";

export const PRODUCT_CONTEXT = `
ReviewPilot — AI review management for India. Automates replies to Google Business Profile (GBP) and Google Play Store reviews. From ₹1,500/month.

WHO IT'S FOR
- Indian app developers publishing on Play Store
- Local businesses on Google Business Profile (restaurants, clinics, salons, gyms, hotels, real estate, auto repair)
- Agencies and franchise owners managing multiple locations/apps

PLATFORMS & INTEGRATIONS
- Google Play Store (live) — connects via Play Console service account; enforces 350-char reply limit
- Google Business Profile (beta, included on every paid plan) — OAuth one-click connect; full auto-reply ships when GBP exits beta
- SMS review collection (coming soon) — smart routing sends 4–5★ customers to Google, 1–3★ to a private feedback form
- Razorpay for billing (UPI, cards, net banking, wallets)

FEATURES
- AI reply drafts in ~3 seconds, trained on 3–5 sample replies + an App Context Profile (known bugs, FAQs, tone, hours, promos)
- Rules-based auto-publish (e.g. auto-publish 4–5★, hold 1–3★ for human approval) or full approval queue
- Unified inbox across Play Store + GBP: bulk-approve, filter, search
- Sentiment analytics, keyword analysis, rating trends
- Multi-language: English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati (auto-detects review language, replies in the same)
- Agency white-label reports (Agency plan)
- Multi-location / multi-app dashboard

PRICING (INR, monthly; annual billing gets ~20% off)
- Starter — ₹1,500/mo: 1 location OR 1 app, 100 AI replies/week, 50 SMS/week (soon), 3 team seats, basic analytics
- Growth — ₹3,000/mo (most popular): 3 locations or apps, 500 AI replies/week, 200 SMS/week (soon), 5 team seats, full analytics + sentiment, data export
- Agency — ₹8,000/mo: 10 locations or apps, unlimited AI replies, 1,000 SMS/week (soon), 10 team seats, white-label reports, priority support
- Enterprise — custom: unlimited locations/apps, SLA, dedicated CSM, custom integrations, SSO, audit logs
- All paid plans include a 7-day free trial, no credit card required
- Positioned as ~17× cheaper than Birdeye and similar global tools

HOW IT WORKS (onboarding, ~5–10 min)
1. Connect Play Console service account or Google Business Profile via OAuth
2. Train the AI: paste 3–5 existing replies + fill the App Context Profile
3. Set auto-publish rules per star rating
4. Approve drafts one-click in the unified inbox, or enable auto-mode
5. Monitor sentiment, keywords, and rating trends on the dashboard
6. (Coming soon) Collect new reviews via SMS with smart routing

POLICIES
- 7-day free trial with full features, no card required
- No refunds after trial — the trial is the evaluation window; cancellation keeps the plan active until the end of the billing period, then downgrades to read-only archive
- Data stored in Supabase (Mumbai region for India accounts) with row-level security; AI models are never trained on customer content; drafts discarded after publish

SUPPORT
- Email: ${SUPPORT_EMAIL}
- Demo booking at /demo, docs at /docs
`.trim();
