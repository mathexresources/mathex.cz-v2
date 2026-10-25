import path from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` v testech nic nedělá
      'server-only': path.resolve(__dirname, 'tests/unit/server-only-stub.ts'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Testy časových pásem musí běžet nezávisle na pásmu stroje
    env: { TZ: 'America/New_York' },
  },
})
