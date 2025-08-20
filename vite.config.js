import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      "rust-markdown": path.resolve(__dirname, "./rust-markdown/pkg/rust_markdown.js")
    },
    dedupe: ['yjs', 'y-protocols', 'lib0', '@lexical/yjs'],
  },
});

/*export default defineConfig({
  resolve: {
    dedupe: ['yjs', 'y-protocols', 'lib0', '@lexical/yjs'],
  },
});*/