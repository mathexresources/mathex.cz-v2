/** Práce s časem v pásmu Europe/Prague bez externích knihoven. */
export const TIME_ZONE = 'Europe/Prague'

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
})

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

export function zonedParts(date: Date): ZonedParts {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]))
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
    weekday: WEEKDAY_INDEX[p.weekday as string] ?? 0,
  }
}

/** O kolik minut je místní čas napřed před UTC v daném okamžiku. */
export function offsetMinutes(date: Date): number {
  const p = zonedParts(date)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

/** Převede místní (pražský) čas na okamžik v UTC. Správně řeší přechod letní/zimní čas. */
export function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const first = offsetMinutes(new Date(guess))
  let ts = guess - first * 60000
  const second = offsetMinutes(new Date(ts))
  if (second !== first) ts = guess - second * 60000
  return new Date(ts)
}

/** Den ve formátu YYYY-MM-DD podle pražského času. */
export function dateKey(date: Date): string {
  const p = zonedParts(date)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function parseKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

export function addDaysToKey(key: string, days: number): string {
  const { year, month, day } = parseKey(key)
  const d = new Date(Date.UTC(year, month - 1, day + days))
  return d.toISOString().slice(0, 10)
}

export function weekdayOfKey(key: string): number {
  const { year, month, day } = parseKey(key)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function minutesFromHHMM(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

const longDate = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortTime = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
})
const fullDate = new Intl.DateTimeFormat('cs-CZ', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const formatLongDate = (d: Date | string) => longDate.format(new Date(d))
export const formatTime = (d: Date | string) => shortTime.format(new Date(d))
export const formatFullDate = (d: Date | string) => fullDate.format(new Date(d))
export const formatDateTime = (d: Date | string) => `${formatLongDate(d)} v ${formatTime(d)}`
