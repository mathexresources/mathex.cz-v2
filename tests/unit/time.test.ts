import { describe, expect, it } from 'vitest'

import { addDaysToKey, dateKey, formatDateTime, weekdayOfKey, zonedToUtc } from '@/lib/time'

describe('pražský čas', () => {
  it('převádí letní čas (UTC+2)', () => {
    expect(zonedToUtc(2026, 7, 1, 9, 0).toISOString()).toBe('2026-07-01T07:00:00.000Z')
  })

  it('převádí zimní čas (UTC+1)', () => {
    expect(zonedToUtc(2026, 1, 15, 9, 0).toISOString()).toBe('2026-01-15T08:00:00.000Z')
  })

  it('zvládne den přechodu na zimní čas (25. 10. 2026)', () => {
    expect(zonedToUtc(2026, 10, 24, 9, 0).toISOString()).toBe('2026-10-24T07:00:00.000Z')
    expect(zonedToUtc(2026, 10, 25, 9, 0).toISOString()).toBe('2026-10-25T08:00:00.000Z')
  })

  it('zvládne přechod roku', () => {
    expect(zonedToUtc(2026, 1, 1, 0, 0).toISOString()).toBe('2025-12-31T23:00:00.000Z')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('den podle pražského, ne UTC času', () => {
    // 23:30 UTC 24. 10. = 01:30 v Praze 25. 10.
    expect(dateKey(new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25')
  })

  it('správný den v týdnu', () => {
    expect(weekdayOfKey('2026-10-25')).toBe(0) // neděle
    expect(weekdayOfKey('2026-10-26')).toBe(1) // pondělí
  })

  it('formátuje česky', () => {
    expect(formatDateTime('2026-10-27T08:30:00Z')).toBe('úterý 27. října v 9:30')
  })
})
