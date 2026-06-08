import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// User/org GitHub Pages site (served from the domain root), so base is '/'.
// If you ever move this to a *project* repo (username.github.io/RepoName/),
// change base to '/RepoName/' and nothing else needs to move.
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      // Each page is an isolated entry point. They intentionally do NOT link
      // to one another so tailored URLs can be sent to different recruiters.
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        work: resolve(__dirname, 'work.html'),
        gamedev: resolve(__dirname, 'gamedev.html'),
        techart: resolve(__dirname, 'techart.html'),
        swe: resolve(__dirname, 'swe.html'),
      },
    },
  },
});