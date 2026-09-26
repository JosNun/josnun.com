import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";

export default defineConfig({
  site: "https://josnun.com",
  output: "static",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },

  markdown: {
    shikiConfig: {
      theme: "solarized-light",
    },
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["heading-anchor"],
            ariaLabel: "Link to this heading",
          },
          content: {
            type: "text",
            value: "#",
          },
        },
      ],
    ],
  },

  integrations: [mdx(), sitemap(), tailwind(), react()],

  server: {
    port: 7777,
  },

  adapter: cloudflare({
    imageService: "compile",
  }),
});