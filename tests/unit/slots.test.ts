import { describe, expect, it } from 'vitest'

import { computeSlots, type SlotSettings } from '@/lib/slots'

// Neděle 25. 10. 2026 19:00 v Praze
const NOW = new Date('2026-10-25T18:00:00Z')

const base: SlotSettings = {
  workingHours: [
    { day: '1', from: '09:00', to: '12:00' },
    { day: '2', from: '09:00', to: '12:00' },
  ],
  slotStepMin: 30,
  bufferMin: 0,
  minNoticeHours: 0,
  maxDaysAhead: 8, // 25. 10. + 8 dní = do 2. 11. včetně
  maxPerDay: 10,
  blackouts: [],
}

const iso = (s: string) => new Date(s).toISOString()
const slotsOn = (r: ReturnType<typeof computeSlots>, day: string) => r.find((d) => d.date === day)?.slots ?? []

describe('volné termíny', () => {
  it('nabízí sloty jen v pracovní dny a v pracovní době', () => {
    const r = computeSlots({ settings: base, durationMin: 30, bookings: [], busy: [], now: NOW })
    expect(r.map((d) => d.date)).toEqual(['2026-10-26', '2026-10-27', '2026-11-02'])
    // 9:00–12:00 po 30 min, 30min schůzka → 6 slotů, první 9:00 = 08:00 UTC (zimní čas)
    expect(slotsOn(r, '2026-10-26')).toHaveLength(6)
    expect(slotsOn(r, '2026-10-26')[0]).toBe(iso('2026-10-26T08:00:00Z'))
    expect(slotsOn(r, '2026-10-26').at(-1)).toBe(iso('2026-10-26T10:30:00Z'))
  })

  it('schůzka se musí vejít do konce pracovní doby', () => {
    const r = computeSlots({ settings: base, durationMin: 60, bookings: [], busy: [], now: NOW })
    expect(slotsOn(r, '2026-10-26').at(-1)).toBe(iso('2026-10-26T10:00:00Z')) // 11:00–12:00
  })

  it('vynechá obsazený čas včetně pauzy mezi schůzkami', () => {
    const booking = { start: new Date('2026-10-26T09:00:00Z'), end: new Date('2026-10-26T09:30:00Z') } // 10:00–10:30
    const r = computeSlots({
      settings: { ...base, bufferMin: 15 },
      durationMin: 30,
      bookings: [booking],
      busy: [],
      now: NOW,
    })
    const day = slotsOn(r, '2026-10-26')
    expect(day).toContain(iso('2026-10-26T08:00:00Z')) // 9:00–9:30, pauza do 9:45 → OK
    expect(day).not.toContain(iso('2026-10-26T08:30:00Z')) // 9:30–10:00 + pauza zasahuje do 10:00
    expect(day).not.toContain(iso('2026-10-26T09:00:00Z'))
    expect(day).not.toContain(iso('2026-10-26T09:30:00Z')) // 10:30 je v pauze po schůzce
    expect(day).toContain(iso('2026-10-26T10:00:00Z'))
  })

  it('respektuje obsazenost z kalendáře', () => {
    const busy = [{ start: new Date('2026-10-27T08:00:00Z'), end: new Date('2026-10-27T11:00:00Z') }]
    const r = computeSlots({ settings: base, durationMin: 30, bookings: [], busy, now: NOW })
    expect(slotsOn(r, '2026-10-27')).toEqual([])
    expect(r.map((d) => d.date)).not.toContain('2026-10-27')
  })

  it('respektuje minimální předstih', () => {
    const now = new Date('2026-10-26T07:00:00Z') // pondělí 8:00
    const r = computeSlots({ settings: { ...base, minNoticeHours: 2 }, durationMin: 30, bookings: [], busy: [], now })
    expect(slotsOn(r, '2026-10-26')[0]).toBe(iso('2026-10-26T09:00:00Z')) // nejdřív 10:00
  })

  it('respektuje dovolenou', () => {
    const r = computeSlots({
      settings: { ...base, blackouts: [{ from: '2026-10-26T12:00:00Z', to: '2026-10-27T12:00:00Z' }] },
      durationMin: 30,
      bookings: [],
      busy: [],
      now: NOW,
    })
    expect(r.map((d) => d.date)).toEqual(['2026-11-02'])
  })

  it('respektuje maximum schůzek za den', () => {
    const bookings = [
      { start: new Date('2026-10-26T08:00:00Z'), end: new Date('2026-10-26T08:30:00Z') },
      { start: new Date('2026-10-26T10:00:00Z'), end: new Date('2026-10-26T10:30:00Z') },
    ]
    const r = computeSlots({ settings: { ...base, maxPerDay: 2 }, durationMin: 30, bookings, busy: [], now: NOW })
    expect(r.map((d) => d.date)).not.toContain('2026-10-26')
  })

  it('nenabízí nic za horizontem', () => {
    const r = computeSlots({ settings: { ...base, maxDaysAhead: 1 }, durationMin: 30, bookings: [], busy: [], now: NOW })
    expect(r.map((d) => d.date)).toEqual(['2026-10-26'])
  })
})

describe('pevně blokované časy', () => {
  it('každý týden: blokuje daný den v týdnu, ostatní dny ne', () => {
    const r = computeSlots({
      settings: { ...base, blockedTimes: [{ repeat: 'weekly', day: '1', from: '09:00', to: '10:30' }] },
      durationMin: 30,
      bookings: [],
      busy: [],
      now: NOW,
    })
    // pondělí 26. 10.: 9:00–10:30 pryč, 10:30 a 11:00 zůstávají
    expect(slotsOn(r, '2026-10-26')).toEqual([iso('2026-10-26T09:30:00Z'), iso('2026-10-26T10:00:00Z'), iso('2026-10-26T10:30:00Z')])
    // a další pondělí 2. 11. také
    expect(slotsOn(r, '2026-11-02')).toHaveLength(3)
    // úterý nedotčené
    expect(slotsOn(r, '2026-10-27')).toHaveLength(6)
  })

  it('jednou: blokuje jen konkrétní datum (i když přijde jako ISO z administrace)', () => {
    const r = computeSlots({
      settings: {
        ...base,
        blockedTimes: [{ repeat: 'once', date: '2026-10-26T23:00:00.000Z', from: '10:00', to: '12:00' }], // = 27. 10. v Praze
      },
      durationMin: 30,
      bookings: [],
      busy: [],
      now: NOW,
    })
    expect(slotsOn(r, '2026-10-27')).toEqual([iso('2026-10-27T08:00:00Z'), iso('2026-10-27T08:30:00Z')])
    expect(slotsOn(r, '2026-10-26')).toHaveLength(6)
  })

  it('blokace nepřidává pauzu mezi schůzkami a ignoruje neplatné řádky', () => {
    const r = computeSlots({
      settings: {
        ...base,
        bufferMin: 30,
        blockedTimes: [
          { repeat: 'weekly', day: '1', from: '11:00', to: '12:00' },
          { repeat: 'weekly', day: '1', from: '12:00', to: '11:00' }, // obrácený čas → ignorovat
          { repeat: 'once', from: '09:00', to: '12:00' }, // bez data → ignorovat
        ],
      },
      durationMin: 30,
      bookings: [],
      busy: [],
      now: NOW,
    })
    expect(slotsOn(r, '2026-10-26').at(-1)).toBe(iso('2026-10-26T09:30:00Z')) // 10:30–11:00 těsně před blokací OK
  })
})
