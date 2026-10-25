export const SEGMENTS = [
  { value: 'remeslnici', label: 'Řemeslníci' },
  { value: 'gastro', label: 'Restaurace a kavárny' },
  { value: 'sluzby', label: 'Služby a obchody' },
  { value: 'jine', label: 'Ostatní' },
] as const

export type Segment = (typeof SEGMENTS)[number]['value']

export const segmentLabel = (value?: string | null) =>
  SEGMENTS.find((s) => s.value === value)?.label ?? ''
