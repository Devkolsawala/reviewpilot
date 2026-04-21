import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Data Deletion — ReviewPilot",
  description:
    "How to delete your ReviewPilot account, disconnect integrations, and permanently remove stored data including WhatsApp messages and reviews.",
  alternates: { canonical: "/data-deletion" },
  openGraph: {
    title: "Data Deletion — ReviewPilot",
    description:
      "How to delete your ReviewPilot data — connections, messages, reviews, and your account.",
    url: `${SITE_URL}/data-deletion`,
  },
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "April 21, 2026";

export default function DataDeletionPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl mb-3">
            Data Deletion Instructions
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <p>
              ReviewPilot gives you full control over your data. This page explains how to
              permanently delete your account, your connections, and all associated data —
              including reviews, WhatsApp messages, AI-generated replies, and connection
              credentials.
            </p>
          </section>

          <Section title="Option 1 — Delete from the dashboard (recommended)">
            <p>The fastest way to delete specific data:</p>
            <ol className="list-decimal ml-6 space-y-1 mt-2">
              <li>
                Log in to{" "}
                <a
                  href="https://www.reviewpilot.co.in"
                  className="text-accent hover:underline"
                >
                  https://www.reviewpilot.co.in
                </a>
              </li>
              <li>
                Go to <strong className="text-foreground">Settings → Connections</strong>
              </li>
              <li>
                Click the trash icon next to the connection you want to remove (Google
                Business Profile, Play Store, or WhatsApp)
              </li>
              <li>Confirm the deletion</li>
            </ol>
            <p className="mt-3">Disconnecting a connection immediately:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Revokes our access to that account</li>
              <li>Stops new data from being ingested</li>
              <li>Marks all associated messages, reviews, and replies for deletion</li>
              <li>Completes permanent deletion within 30 days</li>
            </ul>
          </Section>

          <Section title="Option 2 — Delete your entire ReviewPilot account">
            <p>
              To close your account and delete everything we store about you and your
              business:
            </p>
            <ol className="list-decimal ml-6 space-y-1 mt-2">
              <li>
                Log in to{" "}
                <a
                  href="https://www.reviewpilot.co.in"
                  className="text-accent hover:underline"
                >
                  https://www.reviewpilot.co.in
                </a>
              </li>
              <li>
                Go to <strong className="text-foreground">Settings → General</strong>
              </li>
              <li>
                Scroll to the bottom and click{" "}
                <strong className="text-foreground">Delete account</strong>
              </li>
              <li>Confirm via the email verification link we send you</li>
            </ol>
            <p className="mt-3">
              Account deletion is permanent and irreversible. All data is deleted within 30 days.
            </p>
          </Section>

          <Section title="Option 3 — Email request">
            <p>
              If you cannot access your account, or if you want to delete data for a specific
              customer who contacted you, email us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:hello@reviewpilot.co.in?subject=Data%20Deletion%20Request"
                className="text-accent hover:underline font-semibold"
              >
                hello@reviewpilot.co.in
              </a>
            </p>
            <p className="mt-3">
              Subject line: <code className="text-foreground">Data Deletion Request</code>
            </p>
            <p className="mt-3">Include:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>
                The email address associated with your ReviewPilot account, OR the connected
                business name / WhatsApp phone number
              </li>
              <li>
                Whether you want to delete a specific connection, a specific customer&apos;s
                message history, or your entire account
              </li>
              <li>Any reference IDs if you have them</li>
            </ul>
            <p className="mt-3">
              We respond within 2 business days and complete deletion within 30 days. We will
              send you a confirmation email when deletion is complete.
            </p>
          </Section>

          <Section title="What gets deleted">
            <p>
              When you disconnect a WhatsApp connection or delete your account, we permanently
              remove:
            </p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>
                All access tokens and connection credentials (encrypted at rest; keys are
                cryptographically shredded)
              </li>
              <li>All message content (inbound customer messages and outbound replies)</li>
              <li>
                All contact metadata (WhatsApp display names and phone numbers of your customers)
              </li>
              <li>All reviews fetched from Google Play Store and Google Business Profile</li>
              <li>All AI-generated reply drafts</li>
              <li>All analytics and aggregated data associated with your account</li>
            </ul>
          </Section>

          <Section title="What we retain">
            <p>For legal and operational reasons, we retain:</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>Billing records for 7 years (required under Indian GST law)</li>
              <li>
                Audit logs of account-level actions (login, deletion requests) for 1 year, with
                personal identifiers redacted
              </li>
            </ul>
            <p className="mt-3">
              These retained records do not include any message content or customer data.
            </p>
          </Section>

          <Section title="Questions">
            <p>
              Email{" "}
              <a
                href="mailto:hello@reviewpilot.co.in"
                className="text-accent hover:underline font-semibold"
              >
                hello@reviewpilot.co.in
              </a>{" "}
              with any questions about data deletion. We aim to respond within 2 business days.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-3">
          <Link href="/privacy" className="text-sm text-accent hover:underline">
            Privacy Policy →
          </Link>
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
      <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
