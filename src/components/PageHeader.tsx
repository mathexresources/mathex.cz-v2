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
      <h1 className="mt-6 max-w-[20ch]">{title}</h1>
      {intro && <p className="mt-5 max-w-[60ch] text-[1.2rem] text-pencil">{intro}</p>}
      {children}
    </header>
  )
}
