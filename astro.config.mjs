// @ts-check
import { defineConfig } from 'astro/config';
import { SITE } from './site.config.mjs';

export default defineConfig({
  site: SITE.url,
  base: SITE.base || undefined,
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
});
