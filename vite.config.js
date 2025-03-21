import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
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
					'@/src/models/async-watcher.js': [ ['default', 'asyncWatcher'] ],
				}
			],
			vueTemplate: true,
		}),
		Components({
			dirs: ['src/components'],
			dts: true,
		})
	],
	resolve: {
		alias: {
			'@': __dirname,
		},
	},
	base: "/pokesle-simulator/",
	build: {
		outDir: 'docs',
	},
})