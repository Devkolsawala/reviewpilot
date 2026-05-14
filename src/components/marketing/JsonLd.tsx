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

export const SITE_URL = "https://reviewpilot.co.in";
export const SITE_LOGO = `${SITE_URL}/logo.svg`;
export const SITE_OG = `${SITE_URL}/og-image.svg`;

export const organizationSchema: JsonLdObject = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ReviewPilot",
  url: SITE_URL,
  logo: SITE_LOGO,
  description:
    "AI review management for Indian SMBs and app developers. Automated replies for Play Store reviews, Google Business Profile reviews, and WhatsApp Business messages — in one unified inbox.",
  foundingDate: "2026",
  founders: [
    { "@type": "Person", name: "Dev Kolsawala" },
    { "@type": "Person", name: "Aditya Raj Singh" },
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  // Add Twitter/X and LinkedIn URLs here once social profiles are live.
  sameAs: [],
};

export const websiteSchema: JsonLdObject = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ReviewPilot",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.image ?? SITE_OG,
    author: { "@type": "Organization", name: input.author ?? "ReviewPilot" },
    publisher: {
      "@type": "Organization",
      name: "ReviewPilot",
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    mainEntityOfPage: `${SITE_URL}/blog/${input.slug}`,
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
