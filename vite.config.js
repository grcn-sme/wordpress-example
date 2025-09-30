import { defineConfig } from 'vite';
export default defineConfig({
    base: './',
    appType: 'spa',
    build: {
        rollupOptions: {
            // https://rollupjs.org/configuration-options/
        },
    },
});
