/**
 * Internal linking strategy for SEO
 * Contains links to all key pages in the sitemap
 */

export const sitemapPages = [
  {
    path: '/',
    label: 'Home',
    priority: 1.0,
    description: 'Ruaa Beauty - Professional beauty salon services'
  },
  {
    path: '/book',
    label: 'Book Appointment',
    priority: 0.9,
    description: 'Book your beauty appointment online'
  },
  {
    path: '/lashes',
    label: 'Lashes',
    priority: 0.8,
    description: 'Professional lash services and products'
  },
  {
    path: '/makeup',
    label: 'Makeup',
    priority: 0.8,
    description: 'Professional makeup services'
  },
  {
    path: '/mehendi',
    label: 'Mehendi',
    priority: 0.8,
    description: 'Bridal mehendi and henna services'
  },
  {
    path: '/reviews',
    label: 'Reviews',
    priority: 0.7,
    description: 'Customer reviews and testimonials'
  },
  {
    path: '/contact',
    label: 'Contact',
    priority: 0.7,
    description: 'Contact information and location'
  }
];

/**
 * Generate footer navigation links for internal linking
 * Improves SEO by creating website-wide link structure
 */
export const getInternalLinks = () => {
  return sitemapPages.map(page => ({
    href: page.path,
    text: page.label,
    title: page.description
  }));
};

/**
 * Create rel="canonical" tag to prevent duplicate content issues
 */
export const setCanonicalURL = (path: string) => {
  const baseURL = 'https://www.ruaa-beauty.eu';
  const canonicalURL = `${baseURL}${path}`;
  
  // Remove existing canonical tag
  const existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.remove();
  }
  
  // Add new canonical tag
  const link = document.createElement('link');
  link.rel = 'canonical';
  link.href = canonicalURL;
  document.head.appendChild(link);
};

/**
 * Set Open Graph meta tags for social media sharing
 */
export const setOpenGraphTags = (
  title: string,
  description: string,
  imageUrl: string,
  path: string
) => {
  const baseURL = 'https://www.ruaa-beauty.eu';
  
  const tags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: `${baseURL}${path}` },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' }
  ];
  
  tags.forEach(tag => {
    // Remove existing tag
    const prop = tag.property || tag.name;
    const existingTag = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
    if (existingTag) {
      existingTag.remove();
    }
    
    // Add new tag
    const metaTag = document.createElement('meta');
    if (tag.property) {
      metaTag.setAttribute('property', tag.property);
    } else {
      metaTag.setAttribute('name', tag.name!);
    }
    metaTag.content = tag.content;
    document.head.appendChild(metaTag);
  });
};

/**
 * Update page meta description
 */
export const setMetaDescription = (description: string) => {
  const existingMeta = document.querySelector('meta[name="description"]');
  if (existingMeta) {
    existingMeta.remove();
  }
  
  const meta = document.createElement('meta');
  meta.name = 'description';
  meta.content = description;
  document.head.appendChild(meta);
};
