import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Terms of Service | ReviewPilot",
  description:
    "ReviewPilot's terms of service — rules for using our AI review management platform, subscription terms, refund policy, and limitations of liability.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | ReviewPilot",
    description: "Terms governing use of the ReviewPilot platform.",
    url: `${SITE_URL}/terms`,
  },
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "April 14, 2026";

export default function TermsPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-heading text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

          <section>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of ReviewPilot,
              an AI-powered review management platform operated from India
              (&ldquo;ReviewPilot&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By creating an account
              or using our service, you agree to be bound by these Terms.
            </p>
            <p className="mt-3">
              If you are using ReviewPilot on behalf of a business, you represent that you have
              authority to bind that business to these Terms.
            </p>
          </section>

          <Section title="1. The Service">
            <p>
              ReviewPilot provides tools for managing customer reviews on Google Business Profile
              and Google Play Store, including AI-generated reply drafts, analytics dashboards,
              SMS review collection campaigns, and team collaboration features.
            </p>
            <p className="mt-3">
              We reserve the right to modify, suspend, or discontinue any part of the service at
              any time with reasonable notice. We will not be liable to you or any third party for
              any such modification, suspension, or discontinuation.
            </p>
          </Section>

          <Section title="2. Accounts">
            <ul className="list-disc ml-6 space-y-2">
              <li>You must provide accurate information when creating your account and keep it up to date.</li>
              <li>You are responsible for maintaining the security of your account credentials. Do not share your password.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must be at least 18 years old to use ReviewPilot.</li>
              <li>One person or legal entity may not maintain more than one free account.</li>
              <li>We may suspend or terminate accounts that violate these Terms or that we reasonably believe are being used for abuse, fraud, or illegal activity.</li>
            </ul>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You agree not to use ReviewPilot to:</p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>Post fake, incentivised, or misleading reviews on Google or any other platform. This violates Google&apos;s policies and Indian consumer protection law.</li>
              <li>Harass, threaten, or defame reviewers in published replies.</li>
              <li>Send unsolicited SMS or email messages to people who have not consented to receive them.</li>
              <li>Upload or process any content that is illegal, infringing, or violates any third party&apos;s rights.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from ReviewPilot beyond what is provided through our official interfaces.</li>
              <li>Use ReviewPilot to violate Google&apos;s API Terms of Service or Google Play Developer Program Policies.</li>
              <li>Resell or sublicense access to ReviewPilot without our written consent (Agency plan customers may use white-label reports for their clients; this does not constitute sublicensing of the platform itself).</li>
            </ul>
            <p className="mt-3">
              We may remove content or suspend accounts that violate these rules without prior notice.
            </p>
          </Section>

          <Section title="4. Subscriptions and Payments">
            <Subsection title="4.1 Plans and billing">
              <p className="mt-2">
                ReviewPilot offers paid subscription plans (Starter, Growth, Agency) billed monthly.
                All prices are in Indian Rupees (₹) and are inclusive of applicable GST.
                Payments are processed by Razorpay. By subscribing, you authorise us to charge
                your chosen payment method on a recurring basis.
              </p>
            </Subsection>

            <Subsection title="4.2 Free trial">
              <p className="mt-2">
                New accounts receive a 7-day free trial with full access to all features on the
                selected plan. No credit card is required to start a trial. At the end of the trial,
                your account moves to the free tier unless you subscribe.
              </p>
            </Subsection>
            <Subsection title="4.3 Price changes">
              <p className="mt-2">
                We may change subscription prices with 30 days&apos; advance notice sent to your
                account email. If you do not cancel before the price change takes effect, you
                consent to the new price.
              </p>
            </Subsection>
            <Subsection title="4.4 No refunds">
              <p className="mt-2">
                Subscription payments are non-refundable. The 7-day free trial is the
                evaluation period — you can try every feature on any plan before paying,
                without providing a credit card. If you cancel a paid plan, your
                subscription remains active with full feature access until the end of
                the current billing cycle, after which it moves to the free tier. No
                pro-rata or partial refunds are issued for unused portions of the
                billing period. This policy lets us keep prices India-first and
                self-serve. Genuine billing errors (for example, duplicate charges or
                charges after a confirmed cancellation) are resolved on request —
                contact support with your registered email and payment date.
              </p>
            </Subsection>
          </Section>

          <Section title="5. Your Content">
            <p>
              &ldquo;Your Content&rdquo; means all data you upload to ReviewPilot — business details,
              brand voice samples, App Context Profiles, and any other materials.
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>You retain ownership of Your Content.</li>
              <li>You grant ReviewPilot a limited licence to use Your Content solely to provide the service to you — for example, to generate AI replies using your brand voice samples.</li>
              <li>You are responsible for ensuring Your Content does not infringe any third party&apos;s intellectual property rights.</li>
              <li>We do not use Your Content to train AI models for use outside your account.</li>
            </ul>
          </Section>

          <Section title="6. Third-Party Platforms">
            <p>
              ReviewPilot integrates with Google Business Profile and Google Play Console via
              Google APIs. Your use of those integrations is also subject to Google&apos;s Terms of
              Service. We are not affiliated with Google and cannot guarantee the continued
              availability of Google&apos;s APIs.
            </p>
            <p className="mt-3">
              If Google changes or restricts their APIs in a way that affects ReviewPilot&apos;s
              functionality, we will make reasonable efforts to adapt, but we are not liable for
              any resulting loss of functionality.
            </p>
          </Section>

          <Section title="7. AI-Generated Replies">
            <p>
              ReviewPilot uses AI to generate reply drafts. You acknowledge that:
            </p>
            <ul className="list-disc ml-6 space-y-2 mt-2">
              <li>AI-generated replies may contain errors, inaccuracies, or content inappropriate for your specific context.</li>
              <li>You are responsible for reviewing replies before publishing, particularly for sensitive topics (refunds, safety, legal disputes).</li>
              <li>You are solely responsible for any reply published under your account, whether generated by AI or written manually.</li>
              <li>Using the auto-publish feature does not transfer liability for published content to ReviewPilot.</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              ReviewPilot and its original content (excluding Your Content and third-party data
              pulled via APIs) are the exclusive property of ReviewPilot and are protected by
              copyright and other intellectual property laws. You may not copy, modify, distribute,
              or create derivative works from any part of ReviewPilot without our written consent.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              ReviewPilot is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any
              kind, express or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>
            <p className="mt-3">
              We do not warrant that the service will be uninterrupted, error-free, or that reviews
              or replies will reach Google or Play Store successfully (as this depends on Google&apos;s
              APIs, which are outside our control).
            </p>
            <p className="mt-3">
              We do not guarantee any specific improvement in your star rating, review count, or
              business outcomes from using ReviewPilot.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable Indian law, ReviewPilot&apos;s total
              liability to you for any claims arising from or related to these Terms or the service
              shall not exceed the amount you paid to ReviewPilot in the 3 months immediately
              preceding the event giving rise to the claim.
            </p>
            <p className="mt-3">
              In no event shall ReviewPilot be liable for indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data, or goodwill,
              even if advised of the possibility of such damages.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify and hold ReviewPilot, its founders, and team members harmless
              from any claims, losses, damages, and expenses (including legal fees) arising from:
              (a) your use of the service; (b) Your Content; (c) your violation of these Terms;
              or (d) your violation of any third party&apos;s rights.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              Either party may terminate this agreement at any time. You may cancel your account
              from Settings → Billing. We may terminate or suspend your access immediately if you
              violate these Terms.
            </p>
            <p className="mt-3">
              Upon termination, your right to use the service ceases. Provisions that by their
              nature should survive termination (including ownership, disclaimers, limitation of
              liability, and indemnification) will survive.
            </p>
          </Section>

          <Section title="13. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these
              Terms or your use of ReviewPilot shall be subject to the exclusive jurisdiction of
              the courts located in India.
            </p>
            <p className="mt-3">
              We encourage you to contact us first at{" "}
              <a href="mailto:dev.kolsawala45@gmail.com" className="text-teal-600 hover:underline">
                dev.kolsawala45@gmail.com
              </a>{" "}
              to resolve any dispute informally before initiating legal proceedings.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              notify you by email and update the &ldquo;Last updated&rdquo; date above. Continued use of
              ReviewPilot after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="15. Contact">
            <address className="not-italic mt-3 space-y-1 text-sm">
              <p><strong className="text-foreground">ReviewPilot</strong></p>
              <p>Attn: Dev Kolsawala</p>
              <p>
                Email:{" "}
                <a href="mailto:dev.kolsawala45@gmail.com" className="text-teal-600 hover:underline">
                  dev.kolsawala45@gmail.com
                </a>
              </p>
              <p>Website: <Link href="/" className="text-teal-600 hover:underline">reviewpilot.co.in</Link></p>
            </address>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-3">
          <Link href="/privacy" className="text-sm text-teal-600 hover:underline">
            Privacy Policy →
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
      <h2 className="font-heading text-xl font-bold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-heading text-base font-semibold text-foreground mb-1">{title}</h3>
      {children}
    </div>
  );
}
