const WEB_PROTOCOLS = new Set(["http:", "https:"]);

/** Returns the value only when it is an absolute http(s) URL; anything else could run script or leak data. */
export function safeHttpUrl(value: string | undefined): string | null {
  if (value === undefined) return null;
  try {
    const url = new URL(value);
    return WEB_PROTOCOLS.has(url.protocol) && url.hostname !== "" ? value : null;
  } catch {
    return null;
  }
}

/** The clipboard counts as "a URL" only when it holds exactly one http(s) URL and nothing else. */
export function parsePastedUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return null;
  return safeHttpUrl(trimmed);
}

interface IgnoreRule {
  hostname: string;
  port: string;
  path: string;
}

/** Reads one line of the ignore list; the scheme and a leading `*.` are optional, and a line that is not a host is skipped. */
function parseIgnoreRule(entry: string): IgnoreRule | null {
  const trimmed = entry.trim().replace(/^(https?:\/\/)?\*\./i, "$1");
  if (trimmed === "") return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.hostname === "") return null;
    return { hostname: url.hostname, port: url.port, path: url.pathname.replace(/\/+$/, "") };
  } catch {
    return null;
  }
}

/**
 * Whether the URL is covered by the ignore list, which holds one entry per line.
 * An entry is a host, which also covers its subdomains, optionally narrowed by a
 * port or by a path that must match whole segments.
 */
export function isIgnoredUrl(value: string, list: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return list.split(/\r?\n/).some((entry) => {
    const rule = parseIgnoreRule(entry);
    if (rule === null) return false;
    if (url.hostname !== rule.hostname && !url.hostname.endsWith(`.${rule.hostname}`)) return false;
    if (rule.port !== "" && url.port !== rule.port) return false;
    return rule.path === "" || url.pathname === rule.path || url.pathname.startsWith(`${rule.path}/`);
  });
}
