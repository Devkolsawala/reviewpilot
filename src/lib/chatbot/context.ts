export const SUPPORT_EMAIL = "hello@reviewpilot.co.in";

export const PRODUCT_CONTEXT = `
ReviewPilot — AI review and customer-message management for India. Automates replies across Google Play Store reviews, Google Business Profile (GBP) reviews, and WhatsApp Business messages from a single unified inbox. From $16/month (billed in INR equivalent at checkout).

WHO IT'S FOR
- Indian app developers publishing on Play Store
- Local businesses on Google Business Profile (restaurants, clinics, salons, gyms, hotels, real estate, auto repair)
- Businesses using WhatsApp Business as their primary customer channel (D2C brands, service businesses, support teams)
- Agencies and franchise owners managing multiple locations/apps/WABAs

PLATFORMS & INTEGRATIONS
- Google Play Store (live) — connects via Play Console service account; enforces 350-char reply limit
- Google Business Profile (beta, included on every paid plan) — OAuth one-click connect; full auto-reply ships when GBP exits beta
- WhatsApp Business API (live, included on every plan) — official Meta Cloud API via Embedded Signup. ReviewPilot is a verified Meta Tech Provider with whatsapp_business_messaging and whatsapp_business_management permissions in Advanced Access. ~60-second connect via Facebook Login for Business; supports multi-WABA and multiple phone numbers; templates and business profile manageable inside the dashboard. Long-lived Business Integration System User tokens are encrypted at rest with AES-256-GCM; webhooks are X-Hub-Signature-256 validated; one-click disconnect revokes the token and unsubscribes the webhook.
- SMS review collection (coming soon) — smart routing sends 4–5★ customers to Google, 1–3★ to a private feedback form
- Razorpay for billing (UPI, cards, net banking, wallets)

FEATURES
- AI reply drafts in ~3 seconds, trained on 3–5 sample replies + an App Context Profile (known bugs, FAQs, tone, hours, promos)
- Rules-based auto-publish (e.g. auto-publish 4–5★, hold 1–3★ for human approval) or full approval queue; per-category auto-reply for WhatsApp
- Unified inbox across Play Store + GBP + WhatsApp Business: bulk-approve, filter, search
- Real-time WhatsApp Cloud API webhooks (not polling); replies fire from the customer's verified WABA number
- WhatsApp template management — list, create, and submit templates for Meta approval without leaving ReviewPilot
- Sentiment analytics, keyword analysis, rating trends
- Multi-language: English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati (auto-detects language, replies in the same)
- Multi-location / multi-app / multi-WABA dashboard

PRICING (USD displayed; billed in INR equivalent at checkout; annual billing gets ~20% off; WhatsApp Business automation is included on every plan)
- Starter — $16/mo: 1 location OR 1 app, 100 AI replies/week, WhatsApp Business automation, 50 SMS/week (soon), 3 team seats, basic analytics
- Growth — $32/mo (most popular): 3 locations or apps, 500 AI replies/week, WhatsApp Business automation, 200 SMS/week (soon), 5 team seats, full analytics + sentiment
- Agency — $85/mo: 10 locations or apps, unlimited AI replies, WhatsApp Business automation, 1,000 SMS/week (soon), 10 team seats, priority support
- Enterprise — custom: unlimited locations/apps/WABAs, WhatsApp Business automation, SLA, dedicated CSM, custom integrations, SSO, audit logs
- All paid plans include a 7-day free trial, no credit card required
- WhatsApp conversation charges are billed by Meta directly to the customer's WhatsApp Business Account, not by ReviewPilot. Because replies fire within minutes — well inside Meta's 24-hour customer service window — replies are nearly always free under Meta's pricing.
- Positioned as ~17× cheaper than Birdeye and similar global tools

HOW IT WORKS (onboarding, ~5–10 min)
1. Connect a channel: Play Console service account, Google Business Profile via OAuth, and/or WhatsApp Business via Meta's Embedded Signup (~60 seconds — sign in with Facebook, pick the WABA and phone number, ReviewPilot subscribes the webhook automatically)
2. Train the AI: paste 3–5 existing replies + fill the App Context Profile (tone, business hours, FAQs)
3. Set auto-publish rules per star rating (reviews) or per category (WhatsApp)
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
