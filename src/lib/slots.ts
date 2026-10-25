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
  /** Pevně blokované časy: každý týden ve stejný den, nebo jednorázově v konkrétní den. */
  blockedTimes?: BlockedTime[] | null
}

export type BlockedTime = {
  repeat: 'weekly' | 'once'
  /** 0 = neděle … 6 = sobota (pro repeat = weekly) */
  day?: string | number | null
  /** datum (pro repeat = once); stačí YYYY-MM-DD nebo ISO */
  date?: string | null
  from: string
  to: string
}

/** Blokace platné pro daný den jako intervaly v UTC. */
export function blockedIntervalsForDay(key: string, blocked: BlockedTime[] | null | undefined): Interval[] {
  if (!blocked?.length) return []
  const weekday = String(weekdayOfKey(key))
  const { year, month, day } = parseKey(key)
  const out: Interval[] = []
  for (const b of blocked) {
    const applies =
      b.repeat === 'weekly'
        ? String(b.day) === weekday
        : b.repeat === 'once' && b.date
          ? (b.date.length === 10 ? b.date : dateKey(new Date(b.date))) === key
          : false
    if (!applies || !b.from || !b.to) continue
    const from = minutesFromHHMM(b.from)
    const to = minutesFromHHMM(b.to)
    if (!(to > from)) continue
    out.push({
      start: zonedToUtc(year, month, day, Math.floor(from / 60), from % 60),
      end: zonedToUtc(year, month, day, Math.floor(to / 60), to % 60),
    })
  }
  return out
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
    const blockedToday = blockedIntervalsForDay(key, settings.blockedTimes)

    for (const w of windows) {
      const from = minutesFromHHMM(w.from)
      const to = minutesFromHHMM(w.to)
      for (let m = from; m + durationMin <= to; m += step) {
        const start = zonedToUtc(year, month, day, Math.floor(m / 60), m % 60)
        if (start.getTime() < earliest) continue
        const slot = { start, end: new Date(start.getTime() + durationMin * 60000) }
        if (taken.some((t) => overlaps(slot, t, bufferMs))) continue
        // Pevná blokace se počítá bez pauzy – je to tvůj čas, ne schůzka
        if (blockedToday.some((t) => overlaps(slot, t, 0))) continue
        slots.add(start.toISOString())
      }
    }

    if (slots.size) result.push({ date: key, slots: [...slots].sort() })
  }

  return result
}
