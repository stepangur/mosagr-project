import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
  path?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object | object[];
  breadcrumbs?: Array<{ name: string; path: string }>;
}

const SITE_NAME = "МосАГРПроект";
const BASE_URL = "https://razrabotka-agr.ru";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";
const DEFAULT_OG_IMAGE_ALT = "МосАГРПроект — Разработка буклета АГР в Москве";
const BASE_KEYWORDS = "буклет АГР, АГР Москва, Москомархитектура, архитектурно-градостроительный облик";

function buildBreadcrumbSchema(crumbs: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: `${BASE_URL}${c.path}`,
      })),
    ],
  };
}

export default function Seo({
  title,
  description,
  keywords,
  path = "/",
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
  publishedTime,
  modifiedTime,
  structuredData,
  breadcrumbs,
}: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = `${BASE_URL}${path}`;
  const allKeywords = keywords ? `${keywords}, ${BASE_KEYWORDS}` : BASE_KEYWORDS;

  const schemas: object[] = [];
  if (structuredData) {
    if (Array.isArray(structuredData)) schemas.push(...structuredData);
    else schemas.push(structuredData);
  }
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(buildBreadcrumbSchema(breadcrumbs));
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={DEFAULT_OG_IMAGE_ALT} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ru_RU" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={DEFAULT_OG_IMAGE_ALT} />

      {/* Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
