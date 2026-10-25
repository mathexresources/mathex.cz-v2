import type { Metadata } from 'next'

import { CancelForm } from '@/components/forms/CancelForm'
import { PageHeader } from '@/components/PageHeader'

export const metadata: Metadata = {
  title: 'Zrušení rezervace',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ token?: string }> }

export default async function CancelPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <>
      <PageHeader
        title="Zrušení rezervace"
        intro="Pokud vám termín nevyhovuje, zrušte ho tady a vyberte si nový."
        crumbs={[
          { name: 'Rezervace', path: '/rezervace' },
          { name: 'Zrušení', path: '/rezervace/zrusit' },
        ]}
      />
      <div className="container-site mt-12 max-w-2xl">
        {token ? (
          <CancelForm token={token} />
        ) : (
          <p className="ui text-pencil">Odkaz je neúplný. Použijte prosím odkaz přímo z potvrzovacího e-mailu.</p>
        )}
      </div>
    </>
  )
}
