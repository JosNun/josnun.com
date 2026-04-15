import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('writing', ({ data }) => !data.draft && !data.archived);

  return rss({
    title: 'Josiah Nunemaker - Writing',
    description: 'Thoughts on design, development, and the web',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/writing/${post.slug}/`,
      })),
    customData: `<language>en-us</language>`,
  });
}
