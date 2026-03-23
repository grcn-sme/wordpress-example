import { defineConfig } from 'vite';
export default defineConfig({
    base: '/',
    // use `mpa` to return 404 on non-existing page, url, resources
    appType: 'spa',  // ( spa, mpa ) set to 'mpa' allow dev server behave more like the Github Page; no relation to actual production app type (spa/mpa logic)
    build: {
        rollupOptions: {
            // https://rollupjs.org/configuration-options/
        },
    },
    esbuild: {
        drop: ['console', 'debugger']
    },
    plugins: [],  // at least an empty slot for cloudflare-pages to detect
});
