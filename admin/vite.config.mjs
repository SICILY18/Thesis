import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js')
        }
    },
    server: {
        hmr: true,
    },
    build: {
        // Improve build performance
        target: 'esnext',
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'chart.js', 'react-chartjs-2'],
                    datepicker: ['react-datepicker', 'dayjs'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'chart.js', 'react-chartjs-2', 'react-datepicker', 'dayjs'],
        force: true
    },
    clearScreen: false,
});
