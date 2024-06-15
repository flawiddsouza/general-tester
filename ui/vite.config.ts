import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import checker from 'vite-plugin-checker'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => ['alert-confirm-prompt'].includes(tag)
                }
            }
        }),
        !process.env.VITEST ? checker({ typescript: true }) : undefined,
    ],
    build: {
        emptyOutDir: true,
        outDir: path.resolve(__dirname, '..', 'api', 'public'),
    }
})
