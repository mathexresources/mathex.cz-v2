'use client'

import { useRowLabel } from '@payloadcms/ui'

const DAYS: Record<string, string> = {
  '1': 'Každé pondělí',
  '2': 'Každé úterý',
  '3': 'Každou středu',
  '4': 'Každý čtvrtek',
  '5': 'Každý pátek',
  '6': 'Každou sobotu',
  '0': 'Každou neděli',
}

type Row = { repeat?: string; day?: string; date?: string; from?: string; to?: string; note?: string }

/** Popisek řádku blokace v administraci, např. „Každé úterý 13:00–15:00 · trénink“. */
export function BlockedTimeRowLabel() {
  const { data, rowNumber } = useRowLabel<Row>()
  const when =
    data?.repeat === 'once'
      ? data?.date
        ? new Date(data.date).toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', year: 'numeric' })
        : 'Jednou (vyber datum)'
      : DAYS[String(data?.day ?? '')] ?? 'Každý týden (vyber den)'
  const time = data?.from && data?.to ? ` ${data.from}–${data.to}` : ''
  const note = data?.note ? ` · ${data.note}` : ''
  return <span>{`${when}${time}${note}` || `Blokace ${(rowNumber ?? 0) + 1}`}</span>
}
