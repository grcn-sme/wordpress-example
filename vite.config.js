import { defineConfig } from 'vite';
export default defineConfig({
    base: './',
    // use `mpa` to return 404 on non-existing page, url, resources
    appType: 'mpa',  // ( spa, mpa ) mpa behave more like the Github Page; no relation to actual app type (spa/mpa logic)
    build: {
        rollupOptions: {
            // https://rollupjs.org/configuration-options/
        },
    },
    esbuild: {
        drop: ['console', 'debugger']
    }
});
