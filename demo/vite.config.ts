import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom plugin to handle markdown imports
const markdownPlugin = () => ({
  name: 'markdown-loader',
  transform(code: string, id: string) {
    if (id.slice(-3) === ".md") {
      return `export default ${JSON.stringify(code)};`;
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), markdownPlugin()],
})
