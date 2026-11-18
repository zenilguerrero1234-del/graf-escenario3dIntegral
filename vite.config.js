    import { defineConfig } from 'vite';

    export default defineConfig({
    base: '/graf-escenario3dIntegral/',
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 1200
    }
    });