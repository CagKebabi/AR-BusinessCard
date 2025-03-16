import restart from 'vite-plugin-restart'
import mkcert from 'vite-plugin-mkcert'
import { resolve } from 'path'

export default {
    root: 'src/',
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        assetsInlineLimit: 0, // Tüm asset'leri dışa aktar
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
            },
            output: {
                assetFileNames: (assetInfo) => {
                    if (/\.(mp4|webm|ogg|mp3|wav|flac|aac|glb|gltf|fbx|mind)$/i.test(assetInfo.name)) {
                        return `assets/[name][extname]`;
                    }
                    const info = assetInfo.name.split('.');
                    const extType = info[info.length - 1];
                    return `assets/${extType}/[name]-[hash][extname]`;
                },
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
            }
        }
    },
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env),
        https: true
    },
    plugins: [
        mkcert(),
        restart({ restart: ['./src/assets/**/*'] })
    ],
}

// import restart from 'vite-plugin-restart'
// import mkcert from 'vite-plugin-mkcert'
// import { resolve } from 'path'

// export default {
//     root: 'src/',
//     base: './',
//     server: {
//         https: true,
//         watch: {
//             usePolling: true,
//             interval: 1000,
//         },
//         hmr: {
//             overlay: false
//         }
//     },
//     build: {
//         outDir: '../dist',
//         emptyOutDir: true,
//         sourcemap: true,
//         rollupOptions: {
//             input: {
//                 main: resolve(__dirname, 'src/index.html'),
//             },
//             output: {
//                 assetFileNames: (assetInfo) => {
//                     const info = assetInfo.name.split('.');
//                     const extType = info[info.length - 1];
//                     if (/\.(mp4|webm|ogg|mp3|wav|flac|aac|glb|gltf|mind)$/i.test(assetInfo.name)) {
//                         return `assets/[name][extname]`;
//                     }
//                     return `assets/${extType}/[name]-[hash][extname]`;
//                 },
//                 chunkFileNames: 'js/[name]-[hash].js',
//                 entryFileNames: 'js/[name]-[hash].js',
//             }
//         }
//     },
//     plugins: [
//         mkcert(),
//         restart({
//             restart: [
//                 'vite.config.js',
//                 './src/assets/**/*'
//             ]
//         })
//     ]
// }