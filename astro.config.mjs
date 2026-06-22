import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mathMarkdownProcessor from './src/markdown/math-processor';

export default defineConfig({
  site: 'https://nullstarfish.github.io',
  integrations: [sitemap()],
  markdown: {
    processor: mathMarkdownProcessor(),
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
