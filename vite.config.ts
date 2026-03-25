import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Proxy OAuth-initiate requests to the Lovable auth host during local development.
    // Configure the target in a .env file with VITE_LOVABLE_AUTH_URL, e.g.
    // VITE_LOVABLE_AUTH_URL="https://auth.lovable.dev"
    proxy: {
      '/~oauth': {
        target: process.env.VITE_LOVABLE_AUTH_URL || 'https://auth.lovable.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
