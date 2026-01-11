// vite.config.ts
import { defineConfig } from "file:///C:/Project/pokesle-simulator/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Project/pokesle-simulator/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///C:/Project/pokesle-simulator/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///C:/Project/pokesle-simulator/node_modules/unplugin-vue-components/dist/vite.js";
var __vite_injected_original_dirname = "C:\\Project\\pokesle-simulator";
var vite_config_default = defineConfig(({ mode }) => {
  const htmlPlugin = () => ({
    name: "html-transform",
    transformIndexHtml: (html) => html.replace(/%=(.*?)%/g, (match, p1) => process.env[p1] ?? match)
  });
  return {
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
            "@/models/async-watcher.js": [["default", "asyncWatcher"]]
          }
        ],
        vueTemplate: true,
        dts: "./src/auto-imports.d.ts"
      }),
      Components({
        dirs: ["src/components"],
        dts: true
      }),
      htmlPlugin()
    ],
    resolve: {
      alias: {
        "@": __vite_injected_original_dirname + "/src"
      }
    },
    build: {
      outDir: "docs"
    },
    server: {
      host: "0.0.0.0"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxQcm9qZWN0XFxcXHBva2VzbGUtc2ltdWxhdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxQcm9qZWN0XFxcXHBva2VzbGUtc2ltdWxhdG9yXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Qcm9qZWN0L3Bva2VzbGUtc2ltdWxhdG9yL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnO1xyXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG5cdGNvbnN0IGh0bWxQbHVnaW4gPSAoKSA9PiAoe1xyXG5cdFx0bmFtZTogJ2h0bWwtdHJhbnNmb3JtJyxcclxuXHRcdHRyYW5zZm9ybUluZGV4SHRtbDogKGh0bWw6IHN0cmluZyk6IHN0cmluZyA9PlxyXG5cdFx0XHRodG1sLnJlcGxhY2UoLyU9KC4qPyklL2csIChtYXRjaCwgcDEpID0+IHByb2Nlc3MuZW52W3AxXSA/PyBtYXRjaCksXHJcblx0fSk7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRwbHVnaW5zOiBbXHJcblx0XHRcdHZ1ZSgpLFxyXG5cdFx0XHRBdXRvSW1wb3J0KHtcclxuXHRcdFx0XHRpbmNsdWRlOiBbXHJcblx0XHRcdFx0XHQvXFwuW3RqXXN4PyQvLCAvLyAudHMsIC50c3gsIC5qcywgLmpzeFxyXG5cdFx0XHRcdFx0L1xcLnZ1ZSQvLFxyXG5cdFx0XHRcdFx0L1xcLnZ1ZVxcP3Z1ZS8sIC8vIC52dWVcclxuXHRcdFx0XHRdLFxyXG5cdFx0XHRcdGltcG9ydHM6IFtcclxuXHRcdFx0XHRcdCd2dWUnLFxyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHQnQC9tb2RlbHMvYXN5bmMtd2F0Y2hlci5qcyc6IFsgWydkZWZhdWx0JywgJ2FzeW5jV2F0Y2hlciddIF0sXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XSxcclxuXHRcdFx0XHR2dWVUZW1wbGF0ZTogdHJ1ZSxcclxuXHRcdFx0XHRkdHM6ICcuL3NyYy9hdXRvLWltcG9ydHMuZC50cydcclxuXHRcdFx0fSksXHJcblx0XHRcdENvbXBvbmVudHMoe1xyXG5cdFx0XHRcdGRpcnM6IFsnc3JjL2NvbXBvbmVudHMnXSxcclxuXHRcdFx0XHRkdHM6IHRydWUsXHJcblx0XHRcdH0pLFxyXG5cdFx0XHRodG1sUGx1Z2luKCksXHJcblx0XHRdLFxyXG5cdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRhbGlhczoge1xyXG5cdFx0XHRcdCdAJzogX19kaXJuYW1lICsgJy9zcmMnLFxyXG5cdFx0XHR9LFxyXG5cdFx0fSxcclxuXHRcdGJ1aWxkOiB7XHJcblx0XHRcdG91dERpcjogJ2RvY3MnLFxyXG5cdFx0fSxcclxuXHRcdHNlcnZlcjoge1xyXG5cdFx0XHRob3N0OiAnMC4wLjAuMCcsXHJcblx0XHR9LFxyXG5cdH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQTRRLFNBQVMsb0JBQW9CO0FBQ3pTLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUh2QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN6QyxRQUFNLGFBQWEsT0FBTztBQUFBLElBQ3pCLE1BQU07QUFBQSxJQUNOLG9CQUFvQixDQUFDLFNBQ3BCLEtBQUssUUFBUSxhQUFhLENBQUMsT0FBTyxPQUFPLFFBQVEsSUFBSSxFQUFFLEtBQUssS0FBSztBQUFBLEVBQ25FO0FBRUEsU0FBTztBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1IsSUFBSTtBQUFBLE1BQ0osV0FBVztBQUFBLFFBQ1YsU0FBUztBQUFBLFVBQ1I7QUFBQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUE7QUFBQSxRQUNEO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNDLDZCQUE2QixDQUFFLENBQUMsV0FBVyxjQUFjLENBQUU7QUFBQSxVQUM1RDtBQUFBLFFBQ0Q7QUFBQSxRQUNBLGFBQWE7QUFBQSxRQUNiLEtBQUs7QUFBQSxNQUNOLENBQUM7QUFBQSxNQUNELFdBQVc7QUFBQSxRQUNWLE1BQU0sQ0FBQyxnQkFBZ0I7QUFBQSxRQUN2QixLQUFLO0FBQUEsTUFDTixDQUFDO0FBQUEsTUFDRCxXQUFXO0FBQUEsSUFDWjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1IsT0FBTztBQUFBLFFBQ04sS0FBSyxtQ0FBWTtBQUFBLE1BQ2xCO0FBQUEsSUFDRDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ04sUUFBUTtBQUFBLElBQ1Q7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNQO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
