import * as cheerio from 'cheerio';

export interface ParsedLink {
  url: string;
  title?: string;
  description?: string;
}

const BLOCKED_DOMAINS = [
  'unsubscribe',
  'mailchimp.com',
  '/profile?', // list-manage.com profile/preferences links
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
  // Sponsor/ad domains
  'warp.dev',
  'semrush.com',
  'wisprflow.ai',
  'arcticwolf.com',
  'firecrawl.link',
  'zencoder.ai',
  'pageai.pro',
  'imaginex.video',
  'stickertop.art',
  'nmi.com',
  'framer.link',
  'fandfy',
  'ngrok.com/blog/prompt-caching',
  'paypal.me',
  'algolia.com/resources',
  'bluesky.app', // social
  'bsky.app', // social
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
  // Call-to-action patterns
  'test drive',
  'claim your',
  // Cross-promo newsletters
  'money with katie',
  'healthcare brew',
  'cfo brew',
  'pardon my take',
  // Boilerplate/footer
  'selection criteria',
  'invest in devtools',
  'a human',
  'update subscription',
  // Settings/preferences
  'your settings',
  'tags page',
  'adjust your email',
  'my preference',
  // Promo/CTA
  '% off',
  'join today',
  'your next adventure',
  // View online variants
  'read online',
  'web version',
  // Footer/credits
  'email service by',
  'powered by',
  // Generic link text
  'details here',
  'direct message on',
  'via chat on',
  // Newsletter cross-promo
  'brain food',
  'delivered daily',
  'newsletters for you',
  'buy a classified',
  'get the ebook',
  // Product announcements (promo)
  'product updates',
  'check out',
  // Social sharing buttons
  'twitter',
  'instapaper',
  'pocket',
  // Boilerplate
  'why did i get this',
  'add us to your safe list',
  'recommend this newsletter',
  'read this issue online',
  // Promo with pricing
  'free credit',
  'free trial',
  // Referral/share
  'gift a classified',
  'share with a friend',
  // Subscription/support
  'patron',
  'patreon',
  'support us',
  'buy me a coffee',
  // Ad CTAs
  'get the free',
  'access the',
  'see modern',
  'join free',
  'read online',
  // Social
  'x / twitter',
  'apple podcasts',
];

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'mc_cid', 'mc_eid'];

// Structural regions to skip (headers, footers, sponsors, ads)
const SKIP_SELECTORS = [
  // Header/meta regions
  '.el-splitbar', '#preview', '.preheader',
  // Sponsor regions
  '.norss', '#together', '[class*="sponsor"]',
  // Ad regions (beehiiv/techpresso style)
  '[id*="-ad-"]', '[id*="ad-block"]',
  '[data-ad-link]', '[data-ad-role]',
  // Ads/classifieds
  '.classifieds', '[class*="classified"]',
  // Footer regions
  '#footer', '.noarchive', '.footer',
  '[class*="unsubscribe"]', '[class*="preferences"]',
];

function isInSkipRegion($el: ReturnType<cheerio.CheerioAPI>, $: cheerio.CheerioAPI): boolean {
  return SKIP_SELECTORS.some((sel) => $el.closest(sel).length > 0);
}

function scoreLinkQuality(
  $anchor: ReturnType<cheerio.CheerioAPI>,
  $: cheerio.CheerioAPI,
  title: string,
  positionRatio: number
): number {
  let score = 0;

  // Title quality: meaningful length
  if (title.length >= 10 && title.length <= 100) score += 2;

  // Generic link text penalty
  const lowerTitle = title.toLowerCase().trim();
  if (lowerTitle === 'link' || lowerTitle === 'here' || lowerTitle === 'click') score -= 5;

  // Author attribution nearby
  const $parent = $anchor.parent();
  const siblingText = $parent.text().toLowerCase();
  if (/by\s|author|written/i.test(siblingText)) score += 1;

  // Sponsor detection in ancestors (class names)
  const ancestorClasses = $anchor
    .parents()
    .map((_, el) => $(el).attr('class') || '')
    .get()
    .join(' ')
    .toLowerCase();
  if (ancestorClasses.includes('sponsor')) score -= 5;

  // Ad detection via data attributes
  if ($anchor.attr('data-ad-link') || $anchor.attr('data-ad-role')) score -= 5;

  // Ad detection via ancestor IDs
  const ancestorIds = $anchor
    .parents()
    .map((_, el) => $(el).attr('id') || '')
    .get()
    .join(' ')
    .toLowerCase();
  if (/-ad-|ad-block|sponsor/.test(ancestorIds)) score -= 5;

  // Sponsor detection in container (check td/tr/table parent for sponsor text/class)
  const $container = $anchor.closest('td, tr, table');
  const containerText = $container.text().toLowerCase();
  const containerHtml = $container.html()?.toLowerCase() || '';
  if (containerText.includes('sponsor') || containerHtml.includes('tag-sponsor')) score -= 5;

  // Partner/ad section detection
  if (/from our partner|together with|advertisement/i.test(containerText)) score -= 5;

  // Position penalty (last 25% of doc likely footer)
  if (positionRatio > 0.75) score -= 1;

  // CTA patterns in title
  if (/^(try|book|claim|get|start)\s/i.test(title)) score -= 2;

  // Minimal context = probably navigation
  const parentTextLen = $parent.text().trim().length;
  if (parentTextLen < 30) score -= 1;

  return score;
}

function isBlockedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return BLOCKED_DOMAINS.some((blocked) => lowerUrl.includes(blocked));
}

function isBlockedTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase().trim();
  // Exact match for generic link text
  if (lowerTitle === 'here') return true;
  // Arrow CTAs like "Try now →"
  if (title.includes('→')) return true;
  // Titles starting with "try " (CTA pattern)
  if (lowerTitle.startsWith('try ')) return true;
  // Newsletter self-links with dates (e.g. "Tech / Daily - 2025.12.18")
  if (/tech\s*\/\s*daily\s*-\s*\d{4}\.\d{2}\.\d{2}/i.test(title)) return true;
  if (BLOCKED_TITLES.some((blocked) => lowerTitle === blocked || lowerTitle.includes(blocked))) return true;
  if (lowerTitle.startsWith('http://') || lowerTitle.startsWith('https://')) return true;
  if (/^\s*⭐/.test(title)) return true;
  if (/\(sponsor\)\s*$/i.test(title)) return true;
  // Block titles that look like bare domain names (e.g. "webtoolsweekly.com")
  if (/^[a-z0-9-]+\.[a-z]{2,}$/i.test(lowerTitle)) return true;
  // Block emoji-only or emoji-prefixed promotional titles
  if (/^[\u{1F300}-\u{1F9FF}]/u.test(title)) return true;
  // Block social handles (e.g. "@username")
  if (/^@[a-z0-9_]+$/i.test(lowerTitle)) return true;
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
  // Block very short single-word titles (likely fragments)
  if (!title.includes(' ') && title.length < 5) return false;
  return true;
}

export function parseLinksFromHtml(html: string): ParsedLink[] {
  const $ = cheerio.load(html);
  const results: Map<string, ParsedLink> = new Map();
  const allAnchors = $('a[href]');
  const totalAnchors = allAnchors.length;

  allAnchors.each((index, element) => {
    const $el = $(element);

    // Skip if in excluded structural region
    if (isInSkipRegion($el, $)) return;

    const href = $el.attr('href');
    if (!href || !href.startsWith('http')) return;
    if (isBlockedUrl(href)) return;

    const normalized = normalizeUrl(href);
    if (results.has(normalized)) return;

    const title = cleanText($el.text());
    if (!isValidTitle(title)) return;

    // Score this link for quality
    const positionRatio = totalAnchors > 0 ? index / totalAnchors : 0;
    const score = scoreLinkQuality($el, $, title, positionRatio);
    if (score < 2) return;

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
  const allListItems = $('li');
  const totalItems = allListItems.length;

  // First try list items (newsletters like TLDR)
  allListItems.each((index, li) => {
    const $li = $(li);

    // Skip if in excluded structural region
    if (isInSkipRegion($li, $)) return;

    const $anchor = $li.find('a[href]').first();
    if (!$anchor.length) return;

    const href = $anchor.attr('href');
    if (!href || !href.startsWith('http')) return;
    if (isBlockedUrl(href)) return;

    const normalized = normalizeUrl(href);
    if (results.has(normalized)) return;

    const title = cleanText($anchor.text());
    if (!isValidTitle(title)) return;

    // Score this link for quality
    const positionRatio = totalItems > 0 ? index / totalItems : 0;
    const score = scoreLinkQuality($anchor, $, title, positionRatio);
    if (score < 2) return;

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
  const allContainers = $('p, div, td');
  const totalContainers = allContainers.length;
  let containerIndex = 0;

  allContainers.each((_, container) => {
    const $container = $(container);
    containerIndex++;

    // Skip if in excluded structural region
    if (isInSkipRegion($container, $)) return;

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

      // Score this link for quality
      const positionRatio = totalContainers > 0 ? containerIndex / totalContainers : 0;
      const score = scoreLinkQuality($anchor, $, title, positionRatio);
      if (score < 2) return;

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
