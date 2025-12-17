import * as cheerio from 'cheerio';

export interface ParsedLink {
  url: string;
  title?: string;
  description?: string;
}

const BLOCKED_DOMAINS = [
  'unsubscribe',
  'mailchimp.com',
  'list-manage.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'mailto:',
  'tel:',
  '#',
  'refer.tldr.tech',
  'hub.sparklp.co',
  'jobs.ashbyhq.com',
  'advertise.tldr.tech',
];

const BLOCKED_TITLES = [
  'sign up',
  'signup',
  'advertise',
  'advertising',
  'view online',
  'view in browser',
  'view email in browser',
  'track your referrals',
  'manage your subscriptions',
  'manage subscriptions',
  'update preferences',
  'apply here',
  'create your own role',
  'download the guide',
  'star on github',
  'advertise with us',
  'sponsor',
  'forward to a friend',
  'share this email',
  'privacy policy',
  'terms of service',
  'contact us',
  'click here',
  'read more',
  'learn more',
  'unsubscribe',
  'subscribe',
  'comments',
  'agentfield',
];

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'mc_cid', 'mc_eid'];

function isBlockedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return BLOCKED_DOMAINS.some((blocked) => lowerUrl.includes(blocked));
}

function isBlockedTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase().trim();
  if (BLOCKED_TITLES.some((blocked) => lowerTitle === blocked || lowerTitle.includes(blocked))) return true;
  if (lowerTitle.startsWith('http://') || lowerTitle.startsWith('https://')) return true;
  if (/^\s*⭐/.test(title)) return true;
  if (/\(sponsor\)\s*$/i.test(title)) return true;
  return false;
}

function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    TRACKING_PARAMS.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  normalized = stripTrackingParams(normalized);
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidTitle(title: string): boolean {
  if (!title || title.length < 3 || title.length > 500) return false;
  if (isBlockedTitle(title)) return false;
  return true;
}

export function parseLinksFromHtml(html: string): ParsedLink[] {
  const $ = cheerio.load(html);
  const results: Map<string, ParsedLink> = new Map();

  $('a[href]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');

    if (!href || !href.startsWith('http')) return;
    if (isBlockedUrl(href)) return;

    const normalized = normalizeUrl(href);
    if (results.has(normalized)) return;

    const title = cleanText($el.text());
    if (!isValidTitle(title)) return;

    // Try to find description from surrounding context
    let description: string | undefined;

    // Check for sibling text or paragraph
    const $parent = $el.parent();
    const parentText = cleanText($parent.text());
    if (parentText.length > title.length + 20 && parentText.length < 800) {
      const remainder = parentText.replace(title, '').trim();
      if (remainder.length > 20) {
        description = remainder;
      }
    }

    results.set(normalized, {
      url: normalized,
      title,
      description,
    });
  });

  return Array.from(results.values());
}

export function parseLinksFromListFormat(html: string): ParsedLink[] {
  const $ = cheerio.load(html);
  const results: Map<string, ParsedLink> = new Map();

  // First try list items (newsletters like TLDR)
  $('li').each((_, li) => {
    const $li = $(li);
    const $anchor = $li.find('a[href]').first();

    if (!$anchor.length) return;

    const href = $anchor.attr('href');
    if (!href || !href.startsWith('http')) return;
    if (isBlockedUrl(href)) return;

    const normalized = normalizeUrl(href);
    if (results.has(normalized)) return;

    const title = cleanText($anchor.text());
    if (!isValidTitle(title)) return;

    // Get description from remaining li content
    const liText = cleanText($li.text());
    let description: string | undefined;
    if (liText.length > title.length + 20) {
      const remainder = liText.replace(title, '').trim();
      if (remainder.length > 20 && remainder.length < 800) {
        description = remainder;
      }
    }

    results.set(normalized, {
      url: normalized,
      title,
      description,
    });
  });

  // If we found list items, return them
  if (results.size > 0) {
    return Array.from(results.values());
  }

  // Try paragraphs with links (newsletters like ui.dev, buttondown)
  $('p, div, td').each((_, container) => {
    const $container = $(container);

    // Skip if this is a deeply nested container
    if ($container.find('p, div, td').length > 0) return;

    $container.find('a[href]').each((_, anchor) => {
      const $anchor = $(anchor);
      const href = $anchor.attr('href');

      if (!href || !href.startsWith('http')) return;
      if (isBlockedUrl(href)) return;

      const normalized = normalizeUrl(href);
      if (results.has(normalized)) return;

      const title = cleanText($anchor.text());
      if (!isValidTitle(title)) return;

      // Get context from container
      const containerText = cleanText($container.text());
      let description: string | undefined;
      if (containerText.length > title.length + 30 && containerText.length < 1000) {
        const remainder = containerText.replace(title, '').trim();
        if (remainder.length > 30 && remainder.length < 800) {
          description = remainder;
        }
      }

      results.set(normalized, {
        url: normalized,
        title,
        description,
      });
    });
  });

  // If still nothing, fall back to all links
  if (results.size === 0) {
    return parseLinksFromHtml(html);
  }

  return Array.from(results.values());
}
