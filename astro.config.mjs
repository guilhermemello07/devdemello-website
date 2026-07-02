import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://devdemello.com',
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      // Emit BOTH --shiki-light and --shiki-dark CSS vars (no baked literal
      // color) so syntax.css can drive token colors off the data-theme toggle.
      defaultColor: false,
    },
  },
});
