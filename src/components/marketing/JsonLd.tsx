// Reusable JSON-LD injector. Use in pages to emit structured data.
// Keep data simple/serializable — no functions, no undefined leaves.

type JsonLdObject = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const SITE_URL = "https://www.reviewpilot.co.in";
export const SITE_LOGO = `${SITE_URL}/logo.svg`;
export const SITE_OG = `${SITE_URL}/og-image.svg`;

export const organizationSchema: JsonLdObject = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ReviewPilot",
  url: SITE_URL,
  logo: SITE_LOGO,
  description:
    "AI review management for Indian SMBs and app developers. Automated replies for Google Business Profile and Play Store reviews.",
  foundingDate: "2026",
  founders: [
    { "@type": "Person", name: "Dev Kolsawala" },
    { "@type": "Person", name: "Aditya Raj Singh" },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  sameAs: [],
};
