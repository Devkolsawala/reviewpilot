import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy | ReviewPilot",
  description:
    "ReviewPilot's privacy policy — how we collect, use, and protect your data. Made-in-India review management software.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | ReviewPilot",
    description: "How ReviewPilot collects, uses, and protects your data.",
    url: `${SITE_URL}/privacy`,
  },
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "April 21, 2026";

export default function PrivacyPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl mb-3">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

          <section>
            <p>
              ReviewPilot (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an AI-powered review management
              platform operated from India. This Privacy Policy explains what information we collect
              when you use{" "}
              <Link href="/" className="text-accent hover:underline">reviewpilot.co.in</Link>
              {" "}and related services, how we use it, and your rights regarding that information.
            </p>
            <p className="mt-3">
              By creating an account or using ReviewPilot, you agree to the practices described in
              this policy. If you do not agree, please discontinue use and contact us to delete your
              account.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <Subsection title="1.1 Information you provide directly">
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Account details</strong> — name, email address, and password when you sign up.</li>
                <li><strong className="text-foreground">Business information</strong> — business name, category, and location details you enter during onboarding.</li>
                <li><strong className="text-foreground">Brand voice and tone samples</strong> — example replies or instructions you provide to calibrate the AI.</li>
                <li><strong className="text-foreground">App Context Profile content</strong> — known issues, FAQs, and escalation paths you enter for Play Store apps.</li>
                <li><strong className="text-foreground">Payment information</strong> — billing details processed securely by Razorpay. We do not store card numbers or UPI credentials on our servers.</li>
                <li><strong className="text-foreground">Communications</strong> — emails or messages you send to our support address.</li>
              </ul>
            </Subsection>

            <Subsection title="1.2 Information collected automatically">
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Usage data</strong> — pages visited, features used, clicks, and session duration, collected via Vercel Analytics.</li>
                <li><strong className="text-foreground">Log data</strong> — IP address, browser type, device type, and referring URL, retained for up to 90 days for security and debugging.</li>
                <li><strong className="text-foreground">Cookies</strong> — session cookies for authentication and preference storage. We do not use third-party advertising cookies.</li>
              </ul>
            </Subsection>

            <Subsection title="1.3 Information from third-party platforms">
              <p className="mt-2">
                When you connect Google Business Profile or Google Play Console, we receive and store:
              </p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li>Review text, star rating, reviewer display name, and review date.</li>
                <li>Your existing reply text (if any).</li>
                <li>Business name, address, and category from your Google Business Profile.</li>
                <li>App name and package ID from Play Console.</li>
              </ul>
              <p className="mt-2">
                We access only the data necessary to provide the review management service. We do not
                access your Google Ads, Search Console, or other Google product data.
              </p>
            </Subsection>

            <Subsection title="1.4 WhatsApp Business Platform data">
              <p className="mt-2">
                When you connect a WhatsApp Business Account to ReviewPilot, we process the following
                data on your behalf under Meta&apos;s WhatsApp Business Platform Terms:
              </p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li><strong className="text-foreground">Access credentials</strong> — OAuth access tokens and WhatsApp Business Account identifiers received through Meta&apos;s Embedded Signup flow (or manual setup). Tokens are stored encrypted at rest using AES-256-GCM. We never transmit tokens to third parties.</li>
                <li><strong className="text-foreground">Message content</strong> — Inbound customer messages received via the WhatsApp webhook, and outbound reply messages you or our AI generate. Message content is stored in our database for up to 90 days, after which it is automatically deleted. You can request earlier deletion at any time (see our <Link href="/data-deletion" className="text-accent hover:underline">Data Deletion page</Link>).</li>
                <li><strong className="text-foreground">Contact metadata</strong> — WhatsApp display names, profile names, and phone numbers of customers who message your connected number. We use this only to attribute messages to their sender inside your ReviewPilot inbox.</li>
                <li><strong className="text-foreground">Business profile data</strong> — Your WhatsApp Business profile (display name, business description, quality rating) as returned by the WhatsApp Cloud API, used only to display your connection status inside ReviewPilot.</li>
              </ul>
              <p className="mt-3">We do NOT:</p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li>Sell, rent, or share WhatsApp message content with any third party</li>
                <li>Use WhatsApp message content to train machine learning or AI models</li>
                <li>Retain message content longer than 90 days unless you explicitly request extended retention in writing</li>
                <li>Access WhatsApp data of customers who have not connected their account to ReviewPilot</li>
              </ul>
              <p className="mt-3">
                You may disconnect your WhatsApp Business Account at any time from Settings →
                Connections, which immediately revokes our access and triggers deletion of all
                associated message data within 30 days.
              </p>
            </Subsection>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc ml-6 space-y-2">
              <li>To provide the ReviewPilot service — syncing reviews, generating AI replies, publishing approved replies, and showing analytics.</li>
              <li>To personalise the AI — your brand voice samples and App Context Profile are used solely to generate replies for your account.</li>
              <li>To process payments and manage your subscription via Razorpay.</li>
              <li>To send transactional emails — account verification, billing receipts, and important service notices. We do not send marketing emails without your consent.</li>
              <li>To improve the platform — anonymised usage patterns help us understand which features are working and which need improvement.</li>
              <li>To prevent abuse and ensure security — log data and usage patterns are analysed to detect unusual activity.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to third parties. We do not use your review content
              or business data to train AI models for use outside your account.
            </p>
          </Section>

          <Section title="3. Data Sharing">
            <p>We share data only with the following categories of service providers, and only to the extent necessary:</p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li><strong className="text-foreground">Razorpay</strong> — payment processing. Payment data is handled directly by Razorpay under their PCI-DSS-compliant environment.</li>
              <li><strong className="text-foreground">Google APIs</strong> — to read reviews and publish replies on your behalf via the Google My Business API and Google Play Developer API.</li>
            </ul>
            <p className="mt-3">
              We may disclose information if required by Indian law, a court order, or to protect
              the safety of our users or the public.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <ul className="list-disc ml-6 space-y-1">
              <li>Active account data is retained for as long as your account exists.</li>
              <li>If you cancel your subscription, your account moves to the free tier and your data is retained for 30 days before deletion.</li>
              <li>If you request account deletion, we delete all personal data within 30 days, except data we are legally required to retain (e.g., payment records for tax compliance).</li>
              <li>Anonymised, aggregated analytics data may be retained indefinitely.</li>
            </ul>
          </Section>

          <Section title="5. Security">
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>HTTPS encryption for all data in transit.</li>
              <li>Encrypted storage for credentials and service account keys.</li>
              <li>Row-level security on our database.</li>
              <li>Access controls limiting which team members can access production data.</li>
            </ul>
            <p className="mt-3">
              No system is completely secure. If you become aware of a security vulnerability, please
              contact us at{" "}
              <a href="mailto:dev.kolsawala45@gmail.com" className="text-accent hover:underline">
                dev.kolsawala45@gmail.com
              </a>{" "}
              immediately.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correction</strong> — request correction of inaccurate data.</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and associated personal data.</li>
              <li><strong className="text-foreground">Portability</strong> — request an export of your review and reply data in CSV format.</li>
              <li><strong className="text-foreground">Withdraw consent</strong> — disconnect Google Business Profile or Play Store at any time from Settings → Connections.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a href="mailto:dev.kolsawala45@gmail.com" className="text-accent hover:underline">
                dev.kolsawala45@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use strictly necessary cookies for session management and authentication. We do not
              use advertising or cross-site tracking cookies. You can disable cookies in your browser
              settings, but this will prevent you from staying logged in to ReviewPilot.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              ReviewPilot is a business tool intended for users aged 18 and above. We do not
              knowingly collect personal data from minors. If you believe a minor has created an
              account, contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we
              will notify you by email (to the address on your account) and update the &ldquo;Last
              updated&rdquo; date at the top of this page. Continued use of ReviewPilot after changes
              take effect constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              For privacy-related questions, data requests, or to report a concern:
            </p>
            <address className="not-italic mt-3 space-y-1 text-sm">
              <p><strong className="text-foreground">ReviewPilot</strong></p>
              <p>Attn: Dev Kolsawala</p>
              <p>
                Email:{" "}
                <a href="mailto:dev.kolsawala45@gmail.com" className="text-accent hover:underline">
                  dev.kolsawala45@gmail.com
                </a>
              </p>
              <p>
                Email (data &amp; platform requests):{" "}
                <a href="mailto:hello@reviewpilot.co.in" className="text-accent hover:underline">
                  hello@reviewpilot.co.in
                </a>
              </p>
              <p>Website: <Link href="/" className="text-accent hover:underline">reviewpilot.co.in</Link></p>
            </address>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-3">
          <Link href="/terms" className="text-sm text-accent hover:underline">
            Terms of Service →
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-sans text-base font-semibold tracking-tight text-foreground mb-1">{title}</h3>
      {children}
    </div>
  );
}
