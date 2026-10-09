import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      'momai:sdk': resolve(__dirname, 'src/sdk-mock.ts')
    }
  }
})
