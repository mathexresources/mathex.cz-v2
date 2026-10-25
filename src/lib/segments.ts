export const SEGMENTS = [
  { value: 'weby', label: 'Weby na míru' },
  { value: 'bezpecnost', label: 'Bezpečnost na internetu' },
  // Oborové sekce – připravené na později
  { value: 'remeslnici', label: 'Řemeslníci' },
  { value: 'gastro', label: 'Restaurace a kavárny' },
  { value: 'sluzby', label: 'Služby a obchody' },
  { value: 'jine', label: 'Ostatní' },
] as const

export type Segment = (typeof SEGMENTS)[number]['value']

export const segmentLabel = (value?: string | null) =>
  SEGMENTS.find((s) => s.value === value)?.label ?? ''

/** Která kategorie ceníku patří ke službě daného oboru. */
export const packageCategoryFor = (segment?: string | null) => (segment === 'bezpecnost' ? 'prednasky' : 'web')
