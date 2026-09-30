import type { CardData } from "./cardBlock";
import { safeHttpUrl } from "./url";

/** A `<meta charset>` has to appear within the first 1024 bytes per the HTML spec; read a little more for sloppy pages. */
const SNIFF_BYTES = 4096;

const CHARSET = /charset\s*=\s*["']?([\w.:-]+)/i;
const META_CHARSET = /<meta[^>]+charset\s*=\s*["']?([\w.:-]+)/i;

function tryDecode(buffer: ArrayBuffer, label: string | undefined): string | null {
  if (label === undefined) return null;
  try {
    return new TextDecoder(label).decode(buffer);
  } catch {
    return null;
  }
}

/**
 * Many Japanese sites still serve Shift_JIS or EUC-JP, so decoding as UTF-8
 * blindly would garble their titles. Header first, then the page's own <meta>.
 */
export function decodeHtml(buffer: ArrayBuffer, contentType: string | undefined): string {
  const fromHeader = tryDecode(buffer, contentType === undefined ? undefined : CHARSET.exec(contentType)?.[1]);
  if (fromHeader !== null) return fromHeader;
  const head = new TextDecoder("windows-1252").decode(buffer.slice(0, SNIFF_BYTES));
  return tryDecode(buffer, META_CHARSET.exec(head)?.[1]) ?? new TextDecoder("utf-8").decode(buffer);
}

const clean = (value: string | null | undefined): string | undefined => {
  const text = value?.replace(/\s+/g, " ").trim();
  return text === "" ? undefined : text;
};

function resolveUrl(value: string | null | undefined, base: string): string | undefined {
  const raw = clean(value);
  if (raw === undefined) return undefined;
  try {
    return safeHttpUrl(new URL(raw, base).href) ?? undefined;
  } catch {
    return undefined;
  }
}

function findIcon(doc: Document, base: string): string | undefined {
  const links = Array.from(doc.querySelectorAll("link[rel][href]"));
  const rels = (link: Element) => (link.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
  const icon =
    links.find((link) => rels(link).includes("icon")) ??
    links.find((link) => rels(link).some((rel) => rel.startsWith("apple-touch-icon")));
  return resolveUrl(icon?.getAttribute("href"), base);
}

/** DOMParser documents are inert: no scripts run and no subresources load. */
export function extractMetadata(html: string, pageUrl: string): CardData {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const metas = new Map<string, string>();
  for (const el of Array.from(doc.querySelectorAll("meta[content]"))) {
    const key = (el.getAttribute("property") ?? el.getAttribute("name"))?.trim().toLowerCase();
    const content = clean(el.getAttribute("content"));
    if (key !== undefined && content !== undefined && !metas.has(key)) metas.set(key, content);
  }
  const pick = (...keys: string[]) => keys.map((key) => metas.get(key)).find((value) => value !== undefined);

  const base = resolveUrl(doc.querySelector("base[href]")?.getAttribute("href"), pageUrl) ?? pageUrl;

  const data: CardData = { url: pageUrl };
  const title = clean(pick("og:title", "twitter:title") ?? doc.title);
  const description = pick("og:description", "twitter:description", "description");
  const image = resolveUrl(pick("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"), base);
  const favicon = findIcon(doc, base) ?? resolveUrl("/favicon.ico", pageUrl);
  const site = pick("og:site_name");

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (image !== undefined) data.image = image;
  if (favicon !== undefined) data.favicon = favicon;
  if (site !== undefined) data.site = site;
  return data;
}
