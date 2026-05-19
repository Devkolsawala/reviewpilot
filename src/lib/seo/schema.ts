// Typed JSON-LD schema builders for the marketing site.
// Render via <JsonLd data={...} /> from src/components/marketing/JsonLd.tsx.

export const SITE_URL = "https://reviewpilot.co.in";

type JsonLdObject = Record<string, unknown>;

export function softwareApplicationSchema(input: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  priceCurrency?: string;
  price?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory || "BusinessApplication",
    operatingSystem: input.operatingSystem || "Web",
    offers: {
      "@type": "Offer",
      price: input.price || "0",
      priceCurrency: input.priceCurrency || "INR",
    },
    publisher: {
      "@type": "Organization",
      name: "ReviewPilot",
      url: SITE_URL,
    },
  };
}

export function howToSchema(input: {
  name: string;
  description: string;
  url?: string;
  steps: { name: string; text: string; url?: string }[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    ...(input.url ? { url: input.url } : {}),
    step: input.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
    })),
  };
}

export function aggregateRatingSchema(input: {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}): JsonLdObject {
  return {
    "@type": "AggregateRating",
    ratingValue: input.ratingValue,
    reviewCount: input.reviewCount,
    bestRating: input.bestRating ?? 5,
    worstRating: input.worstRating ?? 1,
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
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
