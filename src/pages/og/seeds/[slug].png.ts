import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { buildOgSvg, pngResponse, svgToPng } from '../../../utils/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const seeds = await getCollection('seeds', ({ data }) => !data.draft);
  return seeds.map((seed) => ({
    params: { slug: seed.slug },
    props: { title: seed.data.title, date: seed.data.pubDate },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, date } = props as { title?: string; date: Date };
  const svg = buildOgSvg({ title: title ?? 'Seed', date });
  return pngResponse(await svgToPng(svg, 1200, 630));
};
