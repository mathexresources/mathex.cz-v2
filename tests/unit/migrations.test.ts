import { readdirSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'

describe('migrace', () => {
  it('každá migrace ve složce je zaregistrovaná (jinak na serveru neproběhne)', () => {
    const dir = path.join(process.cwd(), 'src/migrations')
    const files = readdirSync(dir)
      .filter((f) => /^\d{8}_\d{6}_.+\.ts$/.test(f))
      .map((f) => f.replace(/\.ts$/, ''))
      .sort()
    expect(migrations.map((m) => m.name)).toEqual(files)
  })
})
