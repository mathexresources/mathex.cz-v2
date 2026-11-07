import { Breadcrumbs, type Crumb } from './Breadcrumbs'

export function PageHeader({
  title,
  intro,
  crumbs,
  children,
}: {
  title: string
  intro?: string | null
  crumbs: Crumb[]
  children?: React.ReactNode
}) {
  return (
    <header className="container-site pt-10 sm:pt-14">
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-6 max-w-[18ch] text-[clamp(2.5rem,1.2rem+5.2vw,5.5rem)] leading-[0.94] tracking-[-0.035em]">{title}</h1>
      {intro && <p className="mt-8 max-w-[60ch] border-t-[3px] border-ink pt-6 text-[1.25rem] leading-relaxed">{intro}</p>}
      {children}
    </header>
  )
}
