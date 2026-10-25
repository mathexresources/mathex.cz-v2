import {
  addDaysToKey,
  dateKey,
  minutesFromHHMM,
  parseKey,
  weekdayOfKey,
  zonedToUtc,
} from './time'

export type Interval = { start: Date; end: Date }

export type SlotSettings = {
  workingHours?: { day: string; from: string; to: string }[] | null
  slotStepMin?: number | null
  bufferMin?: number | null
  minNoticeHours?: number | null
  maxDaysAhead?: number | null
  maxPerDay?: number | null
  blackouts?: { from: string; to: string }[] | null
}

export type DaySlots = { date: string; slots: string[] }

const overlaps = (a: Interval, b: Interval, bufferMs: number) =>
  a.start.getTime() < b.end.getTime() + bufferMs && a.end.getTime() + bufferMs > b.start.getTime()

/**
 * Spočítá volné termíny. Čistá funkce – vstupem jsou nastavení, existující
 * rezervace a obsazené bloky z kalendáře, výstupem seznam dnů se začátky slotů (ISO).
 */
export function computeSlots(args: {
  settings: SlotSettings
  durationMin: number
  bookings: Interval[]
  busy: Interval[]
  now?: Date
}): DaySlots[] {
  const { settings, durationMin, bookings, busy } = args
  const now = args.now ?? new Date()
  const step = Math.max(5, settings.slotStepMin ?? 30)
  const bufferMs = Math.max(0, settings.bufferMin ?? 0) * 60000
  const earliest = now.getTime() + Math.max(0, settings.minNoticeHours ?? 0) * 3600000
  const days = Math.max(1, settings.maxDaysAhead ?? 30)
  const maxPerDay = settings.maxPerDay ?? Infinity
  const hours = settings.workingHours ?? []

  const blackoutKeys = (settings.blackouts ?? []).map((b) => ({
    from: dateKey(new Date(b.from)),
    to: dateKey(new Date(b.to)),
  }))

  const bookingsPerDay = new Map<string, number>()
  for (const b of bookings) {
    const key = dateKey(b.start)
    bookingsPerDay.set(key, (bookingsPerDay.get(key) ?? 0) + 1)
  }

  const taken = [...bookings, ...busy]
  const result: DaySlots[] = []
  const todayKey = dateKey(now)

  for (let i = 0; i <= days; i++) {
    const key = addDaysToKey(todayKey, i)
    if (blackoutKeys.some((b) => key >= b.from && key <= b.to)) continue
    if ((bookingsPerDay.get(key) ?? 0) >= maxPerDay) continue

    const weekday = String(weekdayOfKey(key))
    const windows = hours.filter((h) => String(h.day) === weekday)
    if (!windows.length) continue

    const { year, month, day } = parseKey(key)
    const slots = new Set<string>()

    for (const w of windows) {
      const from = minutesFromHHMM(w.from)
      const to = minutesFromHHMM(w.to)
      for (let m = from; m + durationMin <= to; m += step) {
        const start = zonedToUtc(year, month, day, Math.floor(m / 60), m % 60)
        if (start.getTime() < earliest) continue
        const slot = { start, end: new Date(start.getTime() + durationMin * 60000) }
        if (taken.some((t) => overlaps(slot, t, bufferMs))) continue
        slots.add(start.toISOString())
      }
    }

    if (slots.size) result.push({ date: key, slots: [...slots].sort() })
  }

  return result
}
