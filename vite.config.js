import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',

    build: {
        outDir: 'dist',
        lib: {
            entry: resolve(__dirname, 'index.js'),
            name: 'Yiphthachl',
            fileName: (format) => `yiphthachl.${format}.js`
        },
        rollupOptions: {
            output: {
                globals: {}
            }
        }
    },

    server: {
        port: 3000,
        open: '/ide/index.html'
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@compiler': resolve(__dirname, 'compiler'),
            '@runtime': resolve(__dirname, 'runtime'),
            '@ide': resolve(__dirname, 'ide')
        }
    }
});
