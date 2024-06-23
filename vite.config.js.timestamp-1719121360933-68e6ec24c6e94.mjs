// vite.config.js
import { defineConfig } from "file:///D:/Project/pokesle-simulator/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/Project/pokesle-simulator/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///D:/Project/pokesle-simulator/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/Project/pokesle-simulator/node_modules/unplugin-vue-components/dist/vite.js";
var __vite_injected_original_dirname = "D:\\Project\\pokesle-simulator";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/
        // .vue
      ],
      imports: [
        "vue",
        {
          "@/src/models/async-watcher.js": [["default", "asyncWatcher"]]
        }
      ],
      vueTemplate: true
    }),
    Components({
      dirs: ["src/components"],
      dts: true
    })
  ],
  resolve: {
    alias: {
      "@": __vite_injected_original_dirname
    }
  },
  base: "/pokesle-simulator/",
  build: {
    outDir: "docs"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQcm9qZWN0XFxcXHBva2VzbGUtc2ltdWxhdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQcm9qZWN0XFxcXHBva2VzbGUtc2ltdWxhdG9yXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Qcm9qZWN0L3Bva2VzbGUtc2ltdWxhdG9yL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSc7XG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIEF1dG9JbXBvcnQoe1xuXHRcdFx0aW5jbHVkZTogW1xuXHRcdFx0XHQvXFwuW3RqXXN4PyQvLCAvLyAudHMsIC50c3gsIC5qcywgLmpzeFxuXHRcdFx0XHQvXFwudnVlJC8sXG5cdFx0XHRcdC9cXC52dWVcXD92dWUvLCAvLyAudnVlXG5cdFx0XHRdLFxuICAgICAgaW1wb3J0czogW1xuICAgICAgICAndnVlJyxcbiAgICAgICAge1xuXHRcdFx0XHRcdCdAL3NyYy9tb2RlbHMvYXN5bmMtd2F0Y2hlci5qcyc6IFsgWydkZWZhdWx0JywgJ2FzeW5jV2F0Y2hlciddIF0sXG4gICAgICAgIH1cbiAgICAgIF0sXG5cdFx0XHR2dWVUZW1wbGF0ZTogdHJ1ZSxcbiAgICB9KSxcblx0XHRDb21wb25lbnRzKHtcblx0XHRcdGRpcnM6IFsnc3JjL2NvbXBvbmVudHMnXSxcblx0XHRcdGR0czogdHJ1ZSxcblx0XHR9KVxuICBdLFxuXHRyZXNvbHZlOiB7XG5cdFx0YWxpYXM6IHtcblx0XHRcdCdAJzogX19kaXJuYW1lLFxuXHRcdH0sXG5cdH0sXG5cdGJhc2U6IFwiL3Bva2VzbGUtc2ltdWxhdG9yL1wiLFxuXHRidWlsZDoge1xuXHRcdG91dERpcjogJ2RvY3MnLFxuXHR9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFEsU0FBUyxvQkFBb0I7QUFDelMsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBSHZCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFdBQVc7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNSO0FBQUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBO0FBQUEsTUFDRDtBQUFBLE1BQ0csU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsVUFDSCxpQ0FBaUMsQ0FBRSxDQUFDLFdBQVcsY0FBYyxDQUFFO0FBQUEsUUFDNUQ7QUFBQSxNQUNGO0FBQUEsTUFDSCxhQUFhO0FBQUEsSUFDWixDQUFDO0FBQUEsSUFDSCxXQUFXO0FBQUEsTUFDVixNQUFNLENBQUMsZ0JBQWdCO0FBQUEsTUFDdkIsS0FBSztBQUFBLElBQ04sQ0FBQztBQUFBLEVBQ0Q7QUFBQSxFQUNELFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLEtBQUs7QUFBQSxJQUNOO0FBQUEsRUFDRDtBQUFBLEVBQ0EsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Q7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
