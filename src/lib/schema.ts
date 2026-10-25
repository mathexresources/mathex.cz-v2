import type { Faq, Package, Post, Service, SiteSetting, Testimonial, User } from '@/payload-types'

import { absoluteUrl, mediaUrl, SITE_URL } from './seo'

/** Strukturovaná data (Schema.org / JSON-LD) pro vyhledávače. */

export const ORG_ID = `${SITE_URL}/#firma`
export const PERSON_ID = `${SITE_URL}/#autor`

export function businessSchema(site: SiteSetting, testimonials: Testimonial[] = []) {
  const sameAs = (site.socials ?? []).map((s) => s.url).filter(Boolean)
  const rated = testimonials.filter((t) => typeof t.rating === 'number')
  const address =
    site.city || site.street
      ? {
          '@type': 'PostalAddress',
          streetAddress: site.street || undefined,
          addressLocality: site.city || undefined,
          postalCode: site.zip || undefined,
          addressCountry: 'CZ',
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: site.brandName,
    url: SITE_URL,
    description: site.defaultDescription || site.tagline || undefined,
    email: site.email || undefined,
    telephone: site.phone || undefined,
    image: mediaUrl(site.defaultOgImage, 'og') || absoluteUrl('/icon.svg'),
    logo: absoluteUrl('/icon.svg'),
    taxID: site.ico || undefined,
    vatID: site.vatPayer && site.dic ? site.dic : undefined,
    founder: { '@id': PERSON_ID },
    address,
    areaServed: site.serviceArea ? { '@type': 'Place', name: site.serviceArea } : { '@type': 'Country', name: 'Česko' },
    geo:
      site.geo?.lat && site.geo?.lng
        ? { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng }
        : undefined,
    priceRange: '$$',
    knowsLanguage: 'cs',
    sameAs: sameAs.length ? sameAs : undefined,
    aggregateRating:
      rated.length >= 3
        ? {
            '@type': 'AggregateRating',
            ratingValue: (rated.reduce((a, t) => a + (t.rating ?? 0), 0) / rated.length).toFixed(1),
            reviewCount: rated.length,
            bestRating: 5,
          }
        : undefined,
  }
}

export function personSchema(site: SiteSetting) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.ownerName,
    jobTitle: 'Webový vývojář',
    worksFor: { '@id': ORG_ID },
    url: absoluteUrl('/o-mne'),
  }
}

export function websiteSchema(site: SiteSetting) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#web`,
    url: SITE_URL,
    name: site.brandName,
    inLanguage: 'cs-CZ',
    publisher: { '@id': ORG_ID },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqSchema(faqs: Pick<Faq, 'question' | 'answer'>[]) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function articleSchema(post: Post) {
  const author = post.author && typeof post.author === 'object' ? (post.author as User) : null
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: mediaUrl(post.cover, 'og'),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'cs-CZ',
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: author ? { '@type': 'Person', name: author.name, url: absoluteUrl('/o-mne') } : { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
  }
}

export function serviceSchema(service: Service, packages: Package[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.shortDescription,
    serviceType: 'Tvorba webových stránek',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Česko' },
    url: absoluteUrl(`/sluzby/${service.slug}`),
    offers: packages.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: p.price,
      priceCurrency: 'CZK',
      description: p.description,
    })),
  }
}

export function offerCatalogSchema(packages: Package[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Ceník tvorby webů',
    itemListElement: packages.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      description: p.description,
      price: p.price,
      priceCurrency: 'CZK',
      seller: { '@id': ORG_ID },
    })),
  }
}
