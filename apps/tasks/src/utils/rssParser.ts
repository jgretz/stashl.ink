import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Stashl RSS Reader/1.0',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

export async function parseFeed(url: string): Promise<Parser.Output<any>> {
  return await parser.parseURL(url);
}
