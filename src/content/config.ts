import { z, defineCollection } from 'astro:content';

const writingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
  }),
});

const seedsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    pubDate: z.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  writing: writingCollection,
  seeds: seedsCollection,
};
