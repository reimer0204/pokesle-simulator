import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const htmlPlugin = () => ({
		name: 'html-transform',
		transformIndexHtml: (html: string): string =>
			html.replace(/%=(.*?)%/g, (match, p1) => process.env[p1] ?? match),
	});

	return {
		plugins: [
			vue(),
			AutoImport({
				include: [
					/\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
					/\.vue$/,
					/\.vue\?vue/, // .vue
				],
				imports: [
					'vue',
					{
						'@/models/async-watcher.js': [ ['default', 'asyncWatcher'] ],
					}
				],
				vueTemplate: true,
				dts: true,
			}),
			Components({
				dirs: ['src/components'],
				dts: true,
			}),
			htmlPlugin(),
		],
		resolve: {
			alias: {
				'@': __dirname + '/src',
			},
		},
		build: {
			outDir: 'docs',
		},
		server: {
			host: '0.0.0.0',
		},
	}
})