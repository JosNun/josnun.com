import rss from '@astrojs/rss';
import { getSortedSeeds } from '../utils/seeds';
import { formatLongDate } from '../utils/formatDate';

export async function GET(context) {
  const posts = await getSortedSeeds();

  return rss({
    title: 'Josiah Nunemaker - Seeds',
    description: 'Short thoughts and ideas',
    site: context.site,
    items: posts.map((post) => {
      const formattedDate = formatLongDate(post.data.pubDate);
      return {
        title: post.data.title ?? formattedDate,
        pubDate: post.data.pubDate,
        description: post.data.title ? undefined : formattedDate,
        link: `/seeds/${post.slug}/`,
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
