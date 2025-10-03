import { defineConfig } from "vite";
import { watch } from "fs";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
  server: {
    port: 4185,
    host: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    watch: {
      // Watch JSON files in the public directory
      include: ["public/**/*.json"],
      // Exclude node_modules and other unnecessary directories
      exclude: ["node_modules/**", "dist/**"],
    },
  },
  plugins: [
    {
      name: "json-watcher",
      configureServer(server) {
        // Watch JSON files in public directory
        const jsonWatcher = watch(
          "public/assets/scene_json",
          { recursive: true },
          (eventType, filename) => {
            if (filename && filename.endsWith(".json")) {
              console.log(`JSON file changed: ${filename}`);
              // Trigger a full page reload when JSON files change
              server.ws.send({
                type: "full-reload",
              });
            }
          }
        );

        // Clean up watcher on server close
        server.middlewares.use((req, res, next) => {
          if (req.url === "/__close") {
            jsonWatcher.close();
          }
          next();
        });
      },
    },
  ],
});
