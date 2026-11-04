import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses Sass @import; hide the deprecation noise.
        quietDeps: true,
        silenceDeprecations: ['import'],
      },
    },
  },
})
