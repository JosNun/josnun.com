import { getCollection } from 'astro:content';

export const SEEDS_PAGE_SIZE = 20;

export async function getSortedSeeds() {
  const seeds = await getCollection('seeds', ({ data }) => !data.draft);
  return seeds.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
