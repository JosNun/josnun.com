import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { buildOgSvg, pngResponse, svgToPng } from '../../../utils/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { title: post.data.title, date: post.data.pubDate },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, date } = props as { title: string; date: Date };
  const svg = buildOgSvg({ title, date });
  return pngResponse(await svgToPng(svg, 1200, 630));
};
