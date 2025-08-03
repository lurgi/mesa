import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'Mesa',
      fileName: 'mesa'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
})