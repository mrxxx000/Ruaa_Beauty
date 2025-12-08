/**
 * Schema.org structured data markup for SEO
 * Helps search engines understand content better
 */

interface SchemaMarkup {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export const orgLogoSchema: SchemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.ruaa-beauty.eu/#organization',
  name: 'Ruaa Beauty',
  url: 'https://www.ruaa-beauty.eu',
  logo: 'https://www.ruaa-beauty.eu/logo512.png',
  sameAs: [
    'https://www.tiktok.com/@ruaa25az?_r=1&_t=ZN-91tLUtWvLxW',
    'https://www.instagram.com/ruaa5r?igsh=MXQ3azNnNXl2emc5cg==',
    'https://www.instagram.com/glamourmehendi?igsh=MXh3aG10ZzFjbnJtbg=='
  ]
};

export const organizationSchema: SchemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.ruaa-beauty.eu/#local-business',
  name: 'Ruaa Beauty',
  image: [
    'https://www.ruaa-beauty.eu/logo512.png',
    'https://www.ruaa-beauty.eu/logo192.png'
  ],
  description: 'Professional beauty services including bridal mehendi, lashes, and makeup',
  url: 'https://www.ruaa-beauty.eu',
  telephone: '+46704679469',
  email: 'ruaa.azimeh123@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Odengatan 56 274 31',
    addressLocality: 'Skurup',
    addressCountry: 'SE'
  },
  sameAs: [
    'https://www.tiktok.com/@ruaa25az?_r=1&_t=ZN-91tLUtWvLxW',
    'https://www.instagram.com/ruaa5r?igsh=MXQ3azNnNXl2emc5cg==',
    'https://www.instagram.com/glamourmehendi?igsh=MXh3aG10ZzFjbnJtbg=='
  ],
  areaServed: ['SE', 'SV', 'AR'],
  priceRange: '$$'
};

// Service schema for service pages
export const createServiceSchema = (name: string, description: string, imageUrl: string): SchemaMarkup => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  description,
  image: imageUrl,
  provider: {
    '@type': 'LocalBusiness',
    name: 'Ruaa Beauty',
    url: 'https://www.ruaa-beauty.eu'
  },
  areaServed: ['SE', 'SV', 'AR'],
  availableLanguage: ['en', 'sv', 'ar']
});

// Review schema for reviews page
export const createReviewSchema = (
  reviewRating: number,
  reviewCount: number,
  bestRating: number = 5
): SchemaMarkup => ({
  '@context': 'https://schema.org',
  '@type': 'AggregateRating',
  ratingValue: reviewRating.toFixed(1),
  bestRating,
  worstRating: 1,
  ratingCount: reviewCount
});

// Individual review schema
export const createIndividualReviewSchema = (
  reviewText: string,
  rating: number,
  author: string,
  datePublished: string
): SchemaMarkup => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  reviewRating: {
    '@type': 'Rating',
    ratingValue: rating,
    bestRating: 5,
    worstRating: 1
  },
  reviewBody: reviewText,
  author: {
    '@type': 'Person',
    name: author
  },
  datePublished
});

// Breadcrumb schema for navigation
export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>): SchemaMarkup => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

// Contact schema for contact page
export const contactSchema: SchemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Ruaa Beauty',
  url: 'https://www.ruaa-beauty.eu/contact',
  organization: {
    '@type': 'LocalBusiness',
    name: 'Ruaa Beauty',
    telephone: '+46704679469',
    email: 'ruaa.azimeh123@gmail.com'
  }
};

// WebSite schema for homepage (improves search visibility)
export const websiteSchema: SchemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.ruaa-beauty.eu/#website',
  url: 'https://www.ruaa-beauty.eu',
  name: 'Ruaa Beauty',
  description: 'Professional beauty services including bridal mehendi, lashes, and makeup',
  publisher: {
    '@type': 'Organization',
    '@id': 'https://www.ruaa-beauty.eu/#organization',
    name: 'Ruaa Beauty',
    logo: 'https://www.ruaa-beauty.eu/logo512.png'
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.ruaa-beauty.eu/?s={search_term_string}'
    }
  }
};

// FAQPage schema (useful for common questions)
export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>): SchemaMarkup => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
});

// Function to inject schema markup into page head
export const injectSchemaMarkup = (schema: SchemaMarkup): void => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  script.id = `schema-${schema['@type']}`;
  
  // Remove old schema of the same type if exists (don't remove all)
  const oldScript = document.getElementById(`schema-${schema['@type']}`);
  if (oldScript) {
    oldScript.remove();
  }
  
  document.head.appendChild(script);
};

// Inject multiple schemas
export const injectMultipleSchemas = (schemas: SchemaMarkup[]): void => {
  schemas.forEach(schema => injectSchemaMarkup(schema));
};
