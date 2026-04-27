import path from 'path';
export const getBaseViteConfig = (basePath) => ({
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('leaflet') || id.includes('apexcharts') || id.includes('xlsx')) {
                            return 'vendor';
                        }
                    }
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(basePath, './src'),
        },
    },
});
