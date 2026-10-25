import type { Metadata } from 'next'

import { ClosingCta } from '@/components/ClosingCta'
import { PageHeader } from '@/components/PageHeader'
import { ProjectList } from '@/components/ProjectList'
import { getProjects, getSiteSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Portfolio – ukázky webů',
  description: 'Weby pro řemeslníky, restaurace a malé firmy. U každého projektu najdete dobu realizace a rychlost načítání.',
  path: '/portfolio',
})

export default async function PortfolioPage() {
  const [projects, site] = await Promise.all([getProjects(), getSiteSettings()])
  return (
    <>
      <PageHeader
        title="Portfolio"
        intro="Každý web je napsaný od začátku, bez šablon a stavebnic. Proto se načítá rychle a vypadá jinak než konkurence."
        crumbs={[{ name: 'Portfolio', path: '/portfolio' }]}
      />
      <div className="container-site mt-14">
        <ProjectList projects={projects} headingLevel={2} />
      </div>
      <ClosingCta phone={site.phone} />
    </>
  )
}
