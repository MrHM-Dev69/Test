import { env } from "@/lib/env";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output here is always our own generated data, never
      // raw user input, so this is not an XSS vector.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Personal Brand",
        url: env.APP_URL,
        sameAs: [],
      }}
    />
  );
}

export function ProductJsonLd(props: {
  name: string;
  description: string;
  image?: string;
  priceToman: number;
  slug: string;
  avgRating?: number;
  reviewCount?: number;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: props.name,
        description: props.description,
        image: props.image,
        url: `${env.APP_URL}/shop/products/${props.slug}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "IRT",
          price: props.priceToman,
          availability: "https://schema.org/InStock",
        },
        ...(props.reviewCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: props.avgRating ?? 0,
                reviewCount: props.reviewCount,
              },
            }
          : {}),
      }}
    />
  );
}

export function CourseJsonLd(props: {
  name: string;
  description: string;
  slug: string;
  providerName?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name: props.name,
        description: props.description,
        url: `${env.APP_URL}/academy/courses/${props.slug}`,
        provider: {
          "@type": "Organization",
          name: props.providerName ?? "Personal Brand Academy",
        },
      }}
    />
  );
}

export function ArticleJsonLd(props: {
  headline: string;
  description: string;
  slug: string;
  datePublished?: string;
  authorName?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: props.headline,
        description: props.description,
        url: `${env.APP_URL}/academy/articles/${props.slug}`,
        datePublished: props.datePublished,
        author: { "@type": "Person", name: props.authorName ?? "Personal Brand" },
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${env.APP_URL}${item.url}`,
        })),
      }}
    />
  );
}
