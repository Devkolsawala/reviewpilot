export type DocArticle = {
  title: string;
  category: string;
  description: string;
  readTime: string;
  content: string;
};

export const DOC_ARTICLES: Record<string, DocArticle> = {

  // ─── Getting Started ──────────────────────────────────────────────────────

  "create-your-reviewpilot-account": {
    title: "Create Your ReviewPilot Account",
    category: "Getting Started",
    description: "How to sign up, verify your email, and reach the dashboard for the first time.",
    readTime: "2 min read",
    content: `
## Step 1: Go to the sign-up page

Head to [reviewpilot.co.in/signup](/signup). You can sign up with your email address.

## Step 2: Enter your details

Fill in your name and email address, then choose a password. Click **Create account**.

## Step 3: Verify your email

Check your inbox for a verification email from ReviewPilot. Click the confirmation link inside it. The link expires after 24 hours — if it expires, return to the sign-up page and request a new one.

## Step 4: Complete your profile

After verifying, you'll land in the onboarding wizard. Fill in:

- Your business or app name
- Industry (restaurant, clinic, app, retail, etc.)
- Whether you need Google Business Profile, Play Store, or both

This takes under 2 minutes and helps the AI tailor its reply style to your category.

## Step 5: Start your free trial

Your 7-day free trial begins immediately — no credit card required. You have full access to all features on your plan tier during the trial.

> **Tip:** Invite a team member before the trial ends so they can explore the dashboard too. Go to **Settings → Team** to send an invite.

## Troubleshooting

- **Didn't receive the verification email?** Check your spam folder. If it's not there, return to the sign-up page and click *Resend verification email*.
- **Email already in use?** Your address is already registered. Use [Log in](/login) and click *Forgot password* if needed.

## What's next?

Once your account is created, the next step is [connecting your Google Business Profile](/docs/connect-google-business-profile) or [uploading your Play Store service account](/docs/upload-play-store-service-account).
`,
  },

  "connect-google-business-profile": {
    title: "Connect Google Business Profile",
    category: "Getting Started",
    description: "Link your Google Business Profile to ReviewPilot so reviews sync automatically.",
    readTime: "3 min read",
    content: `
## Before you begin

You need:
- A Google account that is an **Owner** or **Manager** of the Business Profile.
- Your Google Business Profile must already be verified with Google.

## Step 1: Go to Connections

In your dashboard, navigate to **Settings → Connections**.

## Step 2: Click "Connect Google Business Profile"

Click the **Connect GBP** button. A Google OAuth consent screen will appear — this is Google's standard permissions screen.

## Step 3: Grant permissions

ReviewPilot requests:
- **View your business information** — to read your business name and location details.
- **Manage your Google Business Profile** — to read reviews and post replies on your behalf.

Select the Google account that owns or manages the Business Profile. If you manage multiple profiles under the same account, all of them will be listed in the next step.

## Step 4: Select your location(s)

After connecting, ReviewPilot lists every Business Profile linked to your account. Toggle on the locations you want to manage. Each active location counts towards your plan limit.

> **Starter plan:** 1 location. **Growth:** 3 locations. **Agency:** 10 locations. You can upgrade at any time from [Billing](/dashboard/settings/billing).

## Step 5: Wait for the first sync

ReviewPilot pulls your last 90 days of reviews in the background. Depending on review volume, this takes between 30 seconds and 3 minutes. You'll see them appear in the [Review Inbox](/dashboard/inbox).

## Troubleshooting

- **"No profiles found" after OAuth:** Make sure the Google account you authenticated has Owner or Manager access on the Business Profile. Viewer access is not sufficient.
- **Reviews not appearing after 5 minutes:** Go to Settings → Connections and click **Force sync** next to the location.
- **Wrong Google account connected:** Disconnect in Settings → Connections, then reconnect and choose the correct account.

## What's next?

Once connected, [set up your AI reply rules](/docs/set-up-auto-reply-rules) to decide which reviews get auto-published and which need approval.
`,
  },

  "upload-play-store-service-account": {
    title: "Upload Play Store Service Account",
    category: "Getting Started",
    description: "Connect your Android app to ReviewPilot using a Google Play Console service account JSON.",
    readTime: "5 min read",
    content: `
## Overview

ReviewPilot connects to Google Play Console via a **service account** — a server-to-server credential you create in Google Cloud Console. This is more secure than OAuth because it doesn't require you to stay logged in.

## Step 1: Open Google Play Console

Go to [play.google.com/console](https://play.google.com/console) and select your app.

## Step 2: Go to API Access

In the left sidebar, click **Setup → API access**. If you see a prompt to link to a Google Cloud Project, follow the on-screen instructions to create or link one.

## Step 3: Create a service account

Under **Service accounts**, click **Create new service account**. This will take you to Google Cloud Console.

In Google Cloud Console:
1. Click **+ Create Service Account**
2. Name it (e.g., *ReviewPilot Integration*)
3. Skip optional fields and click **Done**
4. Click on the newly created service account → **Keys** tab → **Add Key → Create new key → JSON**
5. Download the JSON file — keep it safe, it's a credential.

## Step 4: Grant permissions in Play Console

Return to Play Console. Refresh the service accounts list. Find your new service account and click **Grant access**. Set the permissions to **Reply to reviews** (minimum required).

## Step 5: Upload to ReviewPilot

In ReviewPilot, go to **Settings → Connections → Connect Play Store**. Upload the JSON key file you downloaded. ReviewPilot will verify the connection and list your apps.

## Step 6: Select your app(s)

Toggle on the apps you want ReviewPilot to manage. Each app counts as one connection on your plan.

> **Note:** Google processes new service account permissions within a few minutes. If the verification fails immediately after granting access, wait 2–3 minutes and try again.

## Troubleshooting

- **"Permission denied" error:** Double-check that you clicked *Grant access* in Play Console (not just created the service account). The service account email must have at least *Reply to reviews* permission.
- **"Invalid JSON" error:** Make sure you uploaded the full JSON key file downloaded from Google Cloud Console, not a screenshot or renamed file.
- **App not appearing in the list:** The service account must be linked to the Google Cloud Project that is associated with your Play Console account.

## What's next?

Once your app is connected, [create an App Context Profile](/docs/create-app-context-profile) so the AI knows your known bugs, brand tone, and FAQ answers.
`,
  },

  "complete-onboarding-wizard": {
    title: "Complete the Onboarding Wizard",
    category: "Getting Started",
    description: "A walkthrough of every step in the ReviewPilot onboarding wizard.",
    readTime: "2 min read",
    content: `
## What the wizard covers

The onboarding wizard runs once when you first create your account. It takes 3–5 minutes and configures:

1. Business profile (name, category, language)
2. Platform connections (Google Business Profile and/or Play Store)
3. AI tone and brand voice
4. Auto-reply thresholds (which stars publish automatically)

## Step 1: Business profile

Enter your business name and select your category (restaurant, clinic, e-commerce, mobile app, etc.). This helps the AI generate industry-appropriate reply templates.

Select your primary reply language. ReviewPilot supports English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, and Gujarati out of the box.

## Step 2: Connect a platform

Connect at least one platform to continue:

- **Google Business Profile** — click *Connect with Google*, authorise, and select your location. See the [full guide](/docs/connect-google-business-profile).
- **Play Store** — upload your service account JSON. See the [full guide](/docs/upload-play-store-service-account).

You can add more connections later from Settings.

## Step 3: Brand voice

Paste up to 5 examples of replies you've written previously (or like the sound of). ReviewPilot uses these to calibrate the AI's vocabulary and tone.

If you don't have examples, choose a preset tone: **Warm & Friendly**, **Professional & Formal**, or **Brief & Direct**. You can refine this at any time in [AI Config](/dashboard/settings/ai-config).

## Step 4: Auto-reply rules

Choose your default publishing rules:

- **5-star reviews** — recommended: *Auto-publish*
- **4-star reviews** — recommended: *Draft for approval*
- **1–3 star reviews** — recommended: *Draft, flag as urgent*

These rules can be customised per location or app later. Click **Finish setup** — you're live.

## Skipping the wizard

If you closed the wizard early, you can access each section individually from **Settings → Connections** and **Settings → AI Config**.
`,
  },

  // ─── AI Reply Configuration ────────────────────────────────────────────────

  "create-app-context-profile": {
    title: "Create an App Context Profile",
    category: "AI Reply Configuration",
    description: "Give the AI specific knowledge about your app — known bugs, FAQs, escalation paths — so replies are accurate, not generic.",
    readTime: "4 min read",
    content: `
## What is an App Context Profile?

An App Context Profile (ACP) is a structured knowledge base that tells the AI what to say about specific issues. Without it, the AI writes good generic replies. With it, the AI writes replies that mention your actual bug fix ETA, your actual support email, and your actual FAQ answers.

## How to create one

Go to **Settings → AI Config → App Context Profiles** and click **New Profile**.

## Section 1: Known Issues

List recurring bugs or complaints your users mention. For each issue:
- **Issue name** (e.g., "Crash on Redmi Note 12")
- **Status** — Known, In Progress, Fixed in v2.4, etc.
- **Fix ETA** (optional) — "shipping this Friday", "v2.5 planned for May"

When the AI sees a review mentioning a crash on that device, it will include the fix ETA in the reply instead of a vague "we're looking into it."

## Section 2: FAQs

Add question-answer pairs for things users ask repeatedly:

- "How do I cancel my subscription?" → "Go to Account → Subscription → Cancel."
- "Is the app available on iOS?" → "Currently Android only; iOS is planned for Q3 2026."

The AI uses these to give accurate, specific answers instead of "please contact support."

## Section 3: Escalation paths

Add your support contact information:
- **Support email** — users will be directed here for complex issues
- **Support hours** — "Mon–Sat, 10am–6pm IST"
- **WhatsApp** (optional)

The AI includes escalation details when a review needs direct follow-up.

## Section 4: Brand tone notes

Free-text field for anything else — sign-off phrases you like, words to avoid, cultural context.

> **Example:** "Sign off as 'Team {AppName}'. Never use the word 'unfortunately'. Always acknowledge the reviewer by first name if it's in their review."

## Applying the profile

Once saved, assign the profile to one or more of your connected apps in **Settings → Connections**. Each app can have a different profile.

## Updating the profile

Update it whenever you ship a fix (change "In Progress" to "Fixed in v2.4") or your FAQ answers change. The AI uses the most recent version for all replies going forward.
`,
  },

  "choose-reply-tone": {
    title: "Choose Your Reply Tone",
    category: "AI Reply Configuration",
    description: "Configure how the AI sounds — formal, warm, or brief — and calibrate it with your own reply examples.",
    readTime: "3 min read",
    content: `
## Overview

ReviewPilot's AI mirrors the tone you specify. Getting this right means replies sound like you wrote them, not a bot.

## Tone presets

Go to **Settings → AI Config → Tone** and choose one of three presets as your starting point:

- **Warm & Friendly** — uses first names, emojis sparingly, conversational phrasing. Best for restaurants, salons, consumer apps.
- **Professional & Formal** — complete sentences, no emojis, measured language. Best for clinics, legal, financial services, B2B apps.
- **Brief & Direct** — concise replies (under 80 words), no filler. Best for high-volume apps that need fast throughput.

## Calibrating with your own examples

Presets are a starting point. Paste 3–5 real replies you've written (or replies you'd be proud to publish) into the **Voice samples** field. ReviewPilot extracts your vocabulary patterns, sentence length, and phrasing preferences and blends them with the preset.

More examples = better calibration. 5 samples consistently outperforms 1.

## Per-platform overrides

You can set a different tone for Google Business Profile vs Play Store. GBP replies tend to be longer and warmer; Play Store replies need to respect the 350-character limit and be crisp.

Toggle **Override for Play Store** in the Tone settings to configure a separate voice for app reviews.

## Testing your tone

Use the **Test reply** panel in Settings → AI Config: paste any review text and click **Generate sample**. The AI writes a sample reply using your configured tone. Adjust the settings and re-test until it sounds right — this doesn't publish anything.

## Common adjustments

- **Too formal:** Add a warm sample and switch the preset to Warm & Friendly.
- **Too casual for a medical business:** Switch to Professional, remove emoji-heavy samples.
- **Replies are too long:** Enable the "Concise mode" toggle, which targets 60–100 words.
- **Sign-off isn't right:** Add a note in the [App Context Profile](/docs/create-app-context-profile) — e.g., "Always sign off with 'Warm regards, Team FreshBites'."
`,
  },

  "set-up-auto-reply-rules": {
    title: "Set Up Auto-Reply Rules",
    category: "AI Reply Configuration",
    description: "Control which reviews publish automatically and which land in draft for human approval.",
    readTime: "3 min read",
    content: `
## Overview

Auto-reply rules decide what happens after the AI generates a reply:
- **Auto-publish** — reply goes live immediately on Google/Play Store, no human involvement.
- **Draft for approval** — reply is queued in your inbox for one-click approval.
- **Draft + urgent flag** — reply is queued and marked red so it surfaces at the top of your inbox.

## Where to configure

Go to **Settings → AI Config → Reply Rules**.

## Default recommended setup

| Star rating | Action |
|---|---|
| 5 stars | Auto-publish |
| 4 stars | Draft for approval |
| 3 stars | Draft + urgent flag |
| 1–2 stars | Draft + urgent flag |

This setup means you can safely auto-publish thank-you replies to happy customers while keeping full control over anything that could be sensitive.

## Keyword triggers

Add keywords that override the star-rating rule regardless of rating. Useful for flagging reviews that mention:
- Refunds, compensation, legal
- Safety or health issues
- Staff names
- Specific product defects

Any review containing a flagged keyword gets forced into **Draft + urgent flag**, even if it's a 4-star review.

## Per-location and per-app rules

Rules can be set globally (apply to all connections) or overridden per location/app. Go to **Settings → Connections**, select a location or app, and click **Custom reply rules** to create an override.

## Pausing auto-publish

If you're going through a crisis, a negative press moment, or a product recall, you can pause auto-publish globally with one toggle at the top of the Reply Rules page. All replies will land in draft until you turn it back on.

> **Tip:** During a major app update, temporarily set all 5-star auto-replies to draft until you've confirmed the new version is stable and reviews are positive.
`,
  },

  "test-ai-replies": {
    title: "Test AI Replies",
    category: "AI Reply Configuration",
    description: "Use the test panel to preview what the AI will write before going live.",
    readTime: "2 min read",
    content: `
## Where to find the test panel

Go to **Settings → AI Config** and scroll to the **Test reply** panel at the bottom of the page.

## How to use it

1. Paste any review text into the input box — use a real review from your Google or Play Store for best results.
2. Select which connection to test against (which location or app).
3. Click **Generate sample**.

The AI writes a reply using your current tone settings, brand voice samples, and App Context Profile. The reply is not published anywhere — it's a preview only.

## What to look for

- **Does it use your business name correctly?**
- **Does it acknowledge the specific issue in the review?**
- **Is the tone right for your brand?**
- **Is the length appropriate?** (Play Store replies must be under 350 characters)
- **Does it include the correct support details from your App Context Profile?**

## Iterating on tone

If the test reply doesn't sound right, go back to **Tone** settings and:
- Add more voice samples
- Switch presets
- Add specific instructions to your App Context Profile

Re-test after each change until you're satisfied.

## Testing edge cases

Test these scenarios before going live:
- A 1-star complaint about a specific bug
- A 5-star review with no text content
- A review written in Hindi or another regional language
- A review mentioning a refund request

Confirming the AI handles edge cases well gives you confidence to turn on auto-publish for 5-star reviews.
`,
  },

  // ─── Review Management ─────────────────────────────────────────────────────

  "navigate-review-inbox": {
    title: "Navigate the Review Inbox",
    category: "Review Management",
    description: "Understand the inbox layout, review cards, status indicators, and priority queue.",
    readTime: "3 min read",
    content: `
## Opening the inbox

Click **Inbox** in the left sidebar of your dashboard. This is your primary workspace — every incoming review from all connected platforms lands here.

## Inbox layout

The inbox has three columns:

- **Queue (left panel)** — all reviews awaiting action, sorted by urgency then recency.
- **Review detail (centre)** — the selected review, the AI-generated reply draft, and the edit/publish controls.
- **Context (right panel)** — the reviewer's history, your previous replies, and any matching keyword flags.

## Review card anatomy

Each review card in the queue shows:
- **Platform badge** — Google (G icon) or Play Store (Play icon)
- **Star rating** — coloured from green (5) to red (1)
- **Reviewer name and date**
- **Review excerpt**
- **Status indicator** — Draft, Urgent, Auto-published, or Replied

## Status indicators

| Indicator | Meaning |
|---|---|
| **Draft** | AI reply generated, waiting for your approval |
| **Urgent** | Contains a flagged keyword or is 1–2 stars — needs attention |
| **Auto-published** | Reply was published automatically per your rules |
| **Replied** | Reply published manually by a team member |
| **Pending** | Review received, AI is generating a reply |

## Priority queue

Urgent reviews always appear at the top of the queue, regardless of date. Within the same urgency level, newest reviews appear first.

## Platform filter

Use the **Platform** dropdown at the top of the queue to show only Google reviews, only Play Store reviews, or all. You can also filter by star rating, date range, and status.

## Keyboard shortcuts

- **J / K** — move up and down the queue
- **A** — approve and publish the current draft
- **E** — open the reply editor
- **S** — skip (move to next without publishing)
`,
  },

  "filter-and-search-reviews": {
    title: "Filter and Search Reviews",
    category: "Review Management",
    description: "Find specific reviews using filters, keyword search, and date ranges.",
    readTime: "2 min read",
    content: `
## Search bar

The search bar at the top of the inbox searches across all review text. Type any keyword — a product name, a location, a complaint type — and matching reviews are highlighted instantly. Search is case-insensitive and works across all platforms simultaneously.

## Available filters

Click the **Filter** button to open the filter panel:

- **Platform** — Google Business Profile, Play Store, or All
- **Star rating** — any combination of 1–5 stars
- **Status** — Draft, Urgent, Auto-published, Replied, All
- **Date range** — Last 7 days, 30 days, 90 days, or custom range
- **Location / App** — if you have multiple connections, filter to one at a time

## Combining filters

Filters stack — you can show *only 1-star Play Store reviews from the last 30 days that are still in Draft*. This is useful for weekly triage sessions.

## Saved filters

Click **Save filter** after configuring a combination you use regularly. Saved filters appear as tabs at the top of the inbox for one-click access.

## Sorting

Use the **Sort** dropdown to sort by:
- **Urgency + recency** (default)
- **Newest first**
- **Oldest first**
- **Lowest rating first** — useful when you want to clear all 1-star reviews in one session

## Exporting filtered results

After applying filters, click **Export CSV** to download the matching reviews (text, rating, date, platform, reply status) as a spreadsheet. Useful for reporting to clients or internal ops teams.
`,
  },

  "edit-and-publish-ai-replies": {
    title: "Edit and Publish AI Replies",
    category: "Review Management",
    description: "Review, edit, and publish AI-generated reply drafts in the inbox.",
    readTime: "3 min read",
    content: `
## The reply editor

Select any review in the inbox to open the review detail panel. The **AI-generated draft** appears in the editor on the right side.

## Reading the draft

Before editing, read the full draft. Check:
- Is it factually accurate?
- Does it acknowledge the specific issue?
- Is the tone right?
- For Play Store: is it under 350 characters?

A character counter appears below the editor when a review is from Play Store.

## Editing a draft

Click anywhere in the draft text to edit it. The editor is a plain-text field — no formatting is needed since Google and Play Store render plain text.

Click **Regenerate** to ask the AI to write a completely new version. You can regenerate multiple times and pick the best version.

## Publishing

Once you're happy with the reply, click **Approve & Publish**. ReviewPilot sends the reply to Google or Play Store immediately. Published replies appear in the review within seconds for Google Business Profile; Play Store may take up to 5 minutes to reflect publicly.

After publishing, the review moves from the queue to the **Replied** tab.

## Editing a published reply

To edit a reply you've already published:
1. Find the review in the **Replied** tab.
2. Click **Edit reply**.
3. Make your changes and click **Update reply**.

Google and Play Store allow reply edits at any time.

## Rejecting a draft

If the AI draft is too far off and you want to write manually, click **Write manually** to clear the draft and type your own reply from scratch. Your manual reply is saved for future AI calibration if you opt in.
`,
  },

  "bulk-reply-multiple-reviews": {
    title: "Bulk Reply to Multiple Reviews",
    category: "Review Management",
    description: "Approve and publish multiple AI reply drafts at once to clear your inbox faster.",
    readTime: "2 min read",
    content: `
## When to use bulk reply

Bulk reply is useful when:
- You've been away for a few days and have a backlog of 5-star reviews.
- You want to approve all drafts from a specific location in one session.
- You're onboarding and want to reply to the last 30 days of unanswered reviews at once.

## How to use it

1. In the inbox, click the **checkbox** that appears when you hover over any review card. This enters multi-select mode.
2. Check the reviews you want to approve, or use **Select all** to select every review currently visible (respecting active filters).
3. Click **Approve & Publish all selected**.

ReviewPilot publishes all selected drafts simultaneously. You'll see a progress bar as replies are sent.

## Reviewing before bulk publish

Before bulk-publishing, you can **Preview all** — this opens a scrollable list of every selected draft so you can read them quickly. Uncheck any you want to edit individually before proceeding.

## Limits

- **Starter plan:** Bulk up to 25 replies at once.
- **Growth plan:** Bulk up to 100 replies at once.
- **Agency plan:** No limit.

## Safety note

Bulk publishing skips the individual approval step. It's best used for 5-star reviews, which are low-risk. For 1–3 star reviews, the per-review approval flow ensures you read every reply before it goes live.

> **Tip:** Apply a filter for 5-star drafts, then use Select All + Approve to clear your positive review backlog in under 30 seconds.
`,
  },

  // ─── Analytics & Reports ───────────────────────────────────────────────────

  "read-analytics-dashboard": {
    title: "Read the Analytics Dashboard",
    category: "Analytics & Reports",
    description: "Understand every panel on the ReviewPilot analytics dashboard.",
    readTime: "3 min read",
    content: `
## Opening analytics

Click **Analytics** in the left sidebar. The dashboard gives you a real-time view of your reputation across all connected platforms.

## Summary cards (top row)

| Card | What it shows |
|---|---|
| **Average Rating** | Your current average across all connected platforms, combined |
| **Total Reviews** | Total reviews received in the selected date range |
| **Reply Rate** | % of reviews you've replied to (target: 90%+) |
| **Response Time** | Average hours between review received and reply published |

## Rating trend chart

The main chart shows your average rating over time. Switch the timeframe using the selector (7 days, 30 days, 90 days, 1 year). Look for:
- **Downward trend** — investigate recent reviews for a common complaint thread.
- **Upward trend after you enabled ReviewPilot** — that's the platform working.
- **Flat line at 5.0** — rare and often means low review volume; it will smooth out.

## Platform breakdown

Below the main chart, ratings are split by platform (GBP vs Play Store) and by location or app. This lets you identify which specific location or app is dragging your overall average down.

## Review volume chart

A bar chart showing how many reviews arrived each day. Spikes often correspond to campaigns (SMS review requests), events, or PR moments (good or bad).

## Top keywords

The word cloud / keyword list shows the most-mentioned words across all reviews in the period. Positive keywords (great, fast, helpful) vs negative keywords (slow, crash, rude) give you an instant sentiment summary without reading every review.

## Reply rate by team member

If you have multiple team members, this panel shows each person's reply volume and average response time. Useful for team accountability.
`,
  },

  "track-rating-trends": {
    title: "Track Rating Trends",
    category: "Analytics & Reports",
    description: "How to monitor rating changes over time and spot problems early.",
    readTime: "2 min read",
    content: `
## The 14-day rolling average

The most useful metric to watch is your **14-day rolling average rating** — not your all-time average. An all-time average buries recent signals. Your 14-day average tells you what's happening right now.

Find this in **Analytics → Rating Trend** by setting the date range to 30 days and looking at the last two weeks of the chart.

## Setting up a rating alert

Go to **Settings → Notifications** and configure a **Rating drop alert**:
- Alert me when my 14-day average drops by more than **0.2 stars** in any 7-day window.
- Send alert to: your email address.

This means you'll know within a day if something has gone wrong — a bad batch of reviews, a product issue, a staffing problem — before it compounds.

## Reading a trend correctly

A single 1-star review doesn't move the needle much if you have 200 reviews. What matters is **velocity** — are 1-star reviews arriving faster than 5-star reviews? The chart's slope tells you this better than the absolute number.

- **Slope flat or rising:** healthy. Stay the course.
- **Slope declining 0.1–0.2 over a month:** investigate. Check keywords.
- **Slope declining 0.3+ in a week:** something specific happened. Check reviews from that period immediately.

## Comparing time periods

Use the **Compare** toggle to overlay two date ranges on the same chart — e.g., this month vs last month. A visual upward shift confirms your reply strategy is working.

## Per-location and per-app trends

Always check platform/location splits before concluding there's a problem. Your overall average might be flat while one specific location is declining and another is improving.
`,
  },

  "understand-sentiment-analysis": {
    title: "Understand Sentiment Analysis",
    category: "Analytics & Reports",
    description: "How ReviewPilot classifies review sentiment and how to use keyword data.",
    readTime: "2 min read",
    content: `
## How sentiment is classified

ReviewPilot analyses the text of every review (not just the star rating) and classifies it as:
- **Positive** — review text expresses satisfaction, praise, or recommendation.
- **Neutral** — factual, no strong positive or negative language.
- **Negative** — complaint, frustration, or strong dissatisfaction expressed in text.

A 4-star review can contain negative sentiment if the text describes a problem alongside the rating. ReviewPilot flags this as **Mixed** — a useful catch for reviews that deserve a response even though the rating looks acceptable.

## The sentiment panel

In **Analytics → Sentiment**, you'll see:
- A donut chart: % of reviews that are Positive, Neutral, Mixed, Negative.
- A weekly trend line for each sentiment category.
- **Top positive keywords** — what customers love most.
- **Top negative keywords** — the recurring complaints.

## Using keyword data operationally

The negative keyword list is a product roadmap. If "crash", "slow", and "login" appear in your top 5 negative keywords every week for a month, those are your three highest-priority engineering tasks.

Share this list with your team as a weekly artefact. It's more objective than reading reviews individually.

## Filtering by sentiment

In the review inbox, use the **Sentiment** filter to show only Mixed or Negative reviews. This is useful for prioritised triage — you can quickly find reviews that read positively on the surface but contain a real complaint.

## Language note

Sentiment analysis works across all supported languages (English, Hindi, Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati). Accuracy may be lower for very short reviews or unusual phrasing.
`,
  },

  "export-reports": {
    title: "Export Reports",
    category: "Analytics & Reports",
    description: "Download your review and analytics data as CSV or PDF for sharing with clients or your team.",
    readTime: "2 min read",
    content: `
## Export types

ReviewPilot supports two export formats:

- **CSV export** — raw data for spreadsheet analysis. Includes every review: text, rating, date, platform, location/app, reply status, reply text, response time.
- **PDF report** — formatted summary for sharing with clients or stakeholders. Includes rating trend charts, reply rate, top keywords, and period-over-period comparison. Available on Growth and Agency plans.

## How to export (CSV)

1. Go to **Analytics** or **Inbox**.
2. Apply any filters you want (date range, platform, location, star rating).
3. Click **Export CSV**.
4. The file downloads to your device immediately.

## How to export (PDF)

1. Go to **Analytics**.
2. Set your desired date range (monthly reports work best).
3. Click **Export PDF**.
4. A formatted report is generated and downloaded. This can be white-labelled on the Agency plan — your logo replaces ReviewPilot's in the report header.

## Scheduled exports (Agency plan)

Agency plan users can set up automatic monthly reports sent to a specified email address. Useful for agencies who report to clients every month.

Go to **Settings → Reports → Scheduled exports** to configure.

## What the CSV includes

| Column | Description |
|---|---|
| review_id | ReviewPilot internal ID |
| platform | google_gbp or google_play |
| location_or_app | Name of connected location or app |
| reviewer_name | As shown on the platform |
| rating | 1–5 |
| review_text | Full review text |
| review_date | ISO date |
| reply_status | draft / published / pending / none |
| reply_text | Published reply text (if any) |
| response_time_hours | Hours from review to published reply |
`,
  },

  // ─── SMS & Email Campaigns ─────────────────────────────────────────────────

  "create-sms-campaign": {
    title: "Create an SMS Campaign",
    category: "SMS & Email Campaigns",
    description: "Send personalised SMS review requests to customers and route responses to Google or private feedback.",
    readTime: "4 min read",
    content: `
## Overview

SMS review campaigns let you proactively ask happy customers to leave a Google review. ReviewPilot's smart-routing ensures that customers who rate their experience 4–5 stars are guided to your Google review page, while 1–3 star responses are routed to a private feedback form — protecting your rating.

## Step 1: Go to Campaigns

Click **Campaigns** in the left sidebar and select **New Campaign → SMS**.

## Step 2: Name your campaign

Give the campaign a name for internal reference (e.g., "Post-visit SMS — April 2026"). This name is not visible to customers.

## Step 3: Write your message

Type your SMS message in the text field. Best practices:

- Keep it under 160 characters to avoid multi-part SMS charges.
- Use {{name}} to personalise with the customer's first name.
- Include the review link — use {{link}} as a placeholder. ReviewPilot will replace this with a smart link unique to each recipient.

**Example message:**
> Hi {{name}}, thanks for visiting FreshBites today! How was your experience? Share it here: {{link}} — it means a lot to us 🙏

## Step 4: Choose your sender ID

Select a sender name from your configured sender IDs, or use the default ReviewPilot shared number. For highest open rates, use a recognisable business name.

## Step 5: Upload your recipient list

Upload a CSV with at minimum two columns: **name** and **phone** (10-digit Indian mobile number, without country code). ReviewPilot validates numbers before sending and removes duplicates.

See [Build your recipient list](/docs/build-recipient-list) for the CSV format and list-building tips.

## Step 6: Set the send time

Choose to send immediately or schedule for a specific date and time. Best sending windows for Indian SMBs: **10am–12pm** or **6pm–8pm** on weekdays.

## Step 7: Review and send

The confirmation screen shows recipient count, estimated cost, and a preview of how the message will look. Click **Send campaign** to confirm.

## Tracking results

After sending, the campaign moves to **Active** status. Check [campaign performance](/docs/track-campaign-performance) to see click rates, rating distribution, and reviews generated.
`,
  },

  "build-recipient-list": {
    title: "Build Your Recipient List",
    category: "SMS & Email Campaigns",
    description: "How to format your CSV, collect phone numbers ethically, and maintain a clean list.",
    readTime: "3 min read",
    content: `
## CSV format

Your recipient CSV must have at minimum these two columns (exact header names):

| Column | Required | Format |
|---|---|---|
| name | Yes | First name or full name |
| phone | Yes | 10-digit Indian mobile (no +91, no spaces) |

Optional columns you can include (and use in message templates):

| Column | Usage |
|---|---|
| email | Used for email campaigns |
| last_visit | Personalise message with visit date |
| service | Mention specific service in message |

## Where to get phone numbers

Use numbers you have a legitimate business relationship with — customers who:
- Made a booking or reservation
- Completed a transaction
- Downloaded or used your app (with marketing consent)

Never buy or scrape phone numbers. TRAI regulations in India require prior consent for commercial messages.

## Collecting consent

At minimum, add a line at checkout or booking that says: *"By providing your phone number, you agree to receive a one-time review request SMS from [Business Name]."*

## Importing the list

In the campaign wizard, click **Upload CSV** and select your file. ReviewPilot will:
- Validate all phone numbers (flag invalid formats)
- Remove duplicates
- Show a preview of the first 5 rows before import

## Suppression list

ReviewPilot maintains an automatic suppression list. Anyone who replies STOP to your SMS is added to suppression and will never receive another message from your account. You can also manually add numbers to the suppression list under **Settings → Campaigns → Suppression**.

## List size and plan limits

| Plan | Recipients per campaign |
|---|---|
| Starter | 100 |
| Growth | 1,000 |
| Agency | 10,000 |
`,
  },

  "track-campaign-performance": {
    title: "Track Campaign Performance",
    category: "SMS & Email Campaigns",
    description: "Measure SMS campaign results: delivery, click-through rate, rating distribution, and reviews generated.",
    readTime: "2 min read",
    content: `
## Opening campaign analytics

Click **Campaigns** in the sidebar, then select the campaign you want to review. The campaign detail page shows all metrics.

## Key metrics

| Metric | What it means |
|---|---|
| **Sent** | Total recipients messaged |
| **Delivered** | Confirmed delivery (DLR received from carrier) |
| **Delivery rate** | Delivered ÷ Sent. Target: 90%+. Lower rates indicate bad numbers in your list. |
| **Clicked** | Recipients who tapped the review link |
| **CTR (Click-through rate)** | Clicked ÷ Delivered. Typical range: 20–40% for well-timed campaigns. |
| **Reviews generated** | New Google reviews created within 7 days of the campaign that can be attributed to the link |
| **Rating distribution** | Breakdown of stars from campaign-attributed reviews |

## Smart routing breakdown

For each campaign, you'll see how many recipients were routed to **Google review** (rated 4–5) vs **Private feedback** (rated 1–3). A healthy campaign sends 70–80% of respondents to Google.

## Benchmarks for Indian SMBs

- **Delivery rate:** 88–95%
- **CTR:** 25–38%
- **Review generation rate (clicked → reviewed):** 40–65%

If your CTR is below 15%, try changing the message (shorter, more personal) or the sending time.

## Attribution window

ReviewPilot attributes a review to a campaign if:
- The reviewer clicked your campaign link, AND
- Left a Google review within 7 days of clicking.

This is a conservative attribution model. Actual impact is typically higher.
`,
  },

  "set-up-review-landing-pages": {
    title: "Set Up Review Landing Pages",
    category: "SMS & Email Campaigns",
    description: "How review landing pages work, how to customise them, and how smart routing directs customers.",
    readTime: "3 min read",
    content: `
## What is a review landing page?

When a customer clicks your campaign link, they don't go directly to Google — they land on a ReviewPilot-hosted page first. This is the **smart routing page**.

The page asks: *"How would you rate your experience?"* (1–5 stars). Based on their answer:
- **4–5 stars:** They're directed to your Google review page with a one-tap write-review prompt.
- **1–3 stars:** They see a private feedback form. Their complaint goes to you, not Google.

This smart routing is the core mechanism that improves your Google rating over time.

## How to customise your landing page

Go to **Settings → Campaigns → Landing Pages**.

You can customise:
- **Your business logo** — uploaded image, shown at the top of the page.
- **Business name** — displayed below the logo.
- **Primary colour** — should match your brand.
- **Headline text** — default is "How was your experience at [Business Name]?" — editable.
- **Feedback form prompt** — the question shown to 1–3 star respondents. Keep it open-ended: "Tell us what we can do better."
- **Thank-you message** — shown after a Google review is submitted or private feedback is sent.

## Private feedback delivery

All private feedback (1–3 star responses from the landing page) is:
- Delivered to your inbox in ReviewPilot under the **Feedback** tab.
- Optionally emailed to your business email address — configure in **Settings → Notifications**.

Responding to private feedback shows unhappy customers you care, and sometimes converts them into updated positive reviews.

## Multiple landing pages

You can create separate landing pages per location or app, each with different branding and routing logic. Useful for agencies managing multiple clients, or multi-location businesses with different brand identities.

## Using the page without a campaign

Your landing page URL is static and permanent. You can share it directly:
- In your email signature
- On receipts and invoices
- On physical QR codes
- In your WhatsApp status

It works independently of SMS campaigns.
`,
  },

  // ─── Billing & Plans ───────────────────────────────────────────────────────

  "choose-right-plan": {
    title: "Choose the Right Plan",
    category: "Billing & Plans",
    description: "Compare Starter, Growth, and Agency plans to find the best fit for your business.",
    readTime: "2 min read",
    content: `
## Plan overview

All plans include a **7-day free trial** with full features, no credit card required.

| Feature | Starter | Growth | Agency |
|---|---|---|---|
| Price | ₹1,500/mo | ₹3,000/mo | ₹8,000/mo |
| Locations or apps | 1 | 3 | 10 |
| AI replies per week | 100 | 500 | Unlimited |
| Team seats | 3 | 5 | Unlimited |
| SMS campaigns | ✓ | ✓ | ✓ |
| White-label reports | — | — | ✓ |
| PDF exports | — | ✓ | ✓ |

## Who should choose Starter

- A single restaurant, clinic, salon, or shop with one Google Business Profile.
- An indie app developer with one Play Store app.
- You receive fewer than 100 reviews per week across all platforms.

## Who should choose Growth

- A business with 2–3 locations.
- A small team managing an app and a physical location together.
- You want PDF exports and more than 100 AI replies per week.

## Who should choose Agency

- A marketing or reputation management agency managing multiple client accounts.
- A franchise or chain with more than 3 locations.
- You need white-label reports to send to clients under your brand.
- You need unlimited AI replies (high-volume apps or multi-location chains).

## Comparing to alternatives

ReviewPilot is roughly 17× cheaper than Birdeye at comparable feature levels. See our [comparison pages](/compare/reviewpilot-vs-birdeye) for a full breakdown.

## Changing plans

You can upgrade or downgrade at any time from [Billing settings](/dashboard/settings/billing). Changes take effect at the start of your next billing cycle.
`,
  },

  "upgrade-or-downgrade": {
    title: "Upgrade or Downgrade Your Plan",
    category: "Billing & Plans",
    description: "How to change your plan, what happens to your data, and when changes take effect.",
    readTime: "2 min read",
    content: `
## How to change your plan

1. Go to **Settings → Billing**.
2. Click **Change plan**.
3. Select the new plan.
4. Confirm the change.

That's it — no sales call required.

## When does the change take effect?

Plan changes take effect at the **start of your next billing cycle**. If you upgrade on the 15th of the month, you'll continue on your current plan until your renewal date, then move to the new plan.

## Upgrading mid-cycle

If you need extra capacity immediately (e.g., you've hit your reply limit), contact support and we'll apply a pro-rated upgrade effective today.

## What happens to data when downgrading?

Your data (reviews, reply history, analytics) is always preserved regardless of plan changes. If you downgrade from Growth to Starter and you have 3 connected locations, you'll need to choose which 1 location remains active — the others will be paused (not deleted). You can reactivate them by upgrading again.

## Cancelling

To cancel, go to **Settings → Billing → Cancel subscription**. Your account will remain active until the end of the current billing period, then move to the free plan. Your data is preserved for 30 days after cancellation. We offer a [full refund within 7 days](/docs/payment-methods-and-invoices) of any payment if you're not satisfied.
`,
  },

  "view-usage-and-limits": {
    title: "View Usage and Limits",
    category: "Billing & Plans",
    description: "Where to see how many AI replies, connections, and seats you've used against your plan limits.",
    readTime: "2 min read",
    content: `
## Finding your usage

Go to **Settings → Billing**. The **Usage** section shows:

- **AI replies used this week** — resets every Monday at midnight IST.
- **Connections active** — locations and apps currently syncing.
- **Team seats used** — active members vs your plan limit.

A progress bar shows usage relative to your limit. At 80%, ReviewPilot sends a warning email so you're not caught off-guard.

## AI reply limit

The weekly AI reply limit counts every reply the AI generates — whether you approve it, edit it, or reject it. Auto-published replies also count.

If you hit the weekly limit:
- New reviews still arrive in the inbox.
- AI will not generate drafts for them until the week resets (Monday midnight IST).
- You can still write and publish manual replies — there's no limit on manual replies.

**To increase your limit:** upgrade your plan from the Billing page.

## Connection limit

Each active location or app counts as one connection. Paused connections do not count against the limit. If you're at your limit and want to add a new location, either upgrade your plan or pause an existing connection.

## Weekly reset timing

The AI reply counter resets at **midnight IST every Monday**. The reset is automatic — you'll see the counter drop to 0 at that time regardless of your billing renewal date.

## Seat limit

Each team member with a ReviewPilot account under your workspace uses one seat. If you've reached your seat limit and want to add a team member, upgrade to a higher plan or remove a member who no longer needs access.
`,
  },

  "payment-methods-and-invoices": {
    title: "Payment Methods and Invoices",
    category: "Billing & Plans",
    description: "Accepted payment methods, how to download invoices, and how to request a refund.",
    readTime: "2 min read",
    content: `
## Accepted payment methods

ReviewPilot processes payments through **Razorpay**, India's leading payment gateway. We accept:

- All major **credit and debit cards** (Visa, Mastercard, RuPay, Amex)
- **UPI** (GPay, PhonePe, Paytm, BHIM, any UPI app)
- **Net banking** — most Indian banks supported
- **Wallets** — Paytm, Amazon Pay, and others

All prices are in **Indian Rupees (₹)**. No foreign exchange, no surprise currency conversion.

## Billing cycle

Subscriptions renew monthly on the anniversary of your first paid payment. For example, if you subscribed on April 10, your next charge is May 10.

## Downloading invoices

1. Go to **Settings → Billing → Billing history**.
2. Click the **Download invoice** link next to any past payment.
3. The invoice downloads as a PDF with your business name, GST details (if provided), and payment breakdown.

## Updating billing details

To change your payment method or update billing address, go to **Settings → Billing → Payment method** and click **Update**. You'll be redirected to the Razorpay-hosted payment update page.

## Refund policy

We offer a **full refund within 7 days** of any payment, no questions asked. To request a refund, email **dev.kolsawala45@gmail.com** with your registered email address and the payment date. Refunds are processed within 5–7 business days back to the original payment method.

## GST

ReviewPilot is a software service. GST at 18% is applicable. If you need a GST invoice with your GSTIN, go to **Settings → Billing → Tax details** and add your GSTIN before your next billing cycle. It will appear on all future invoices.
`,
  },
};

export function generateDocStaticParams() {
  return Object.keys(DOC_ARTICLES).map((slug) => ({ slug }));
}
