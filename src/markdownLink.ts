const TITLE_ESCAPES = /[\\[\]]/g;
const URL_ESCAPES: Record<string, string> = { "(": "%28", ")": "%29", " ": "%20" };

export function formatMarkdownLink(title: string, url: string): string {
  const text = title.replace(/\s+/g, " ").trim().replace(TITLE_ESCAPES, (char) => `\\${char}`);
  const target = url.replace(/[() ]/g, (char) => URL_ESCAPES[char] ?? char);
  return `[${text}](${target})`;
}
