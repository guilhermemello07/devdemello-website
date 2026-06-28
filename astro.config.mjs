import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://devdemello.com',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
