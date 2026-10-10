/** Language tag of the fenced block that stores a card. Distinct from Auto Card Link's `cardlink`. */
export const CARD_LANGUAGE = "linkcard";

export interface CardData {
  url: string;
  title?: string;
  author?: string;
  description?: string;
  image?: string;
  favicon?: string;
  site?: string;
}

type CardField = keyof CardData;

const FIELDS: readonly CardField[] = ["url", "title", "author", "description", "image", "favicon", "site"];

const isField = (key: string): key is CardField => (FIELDS as readonly string[]).includes(key);

const oneLine = (value: string): string => value.replace(/\s+/g, " ").trim();

const unquote = (value: string): string => {
  const first = value[0];
  if (value.length >= 2 && (first === '"' || first === "'") && value.endsWith(first)) return value.slice(1, -1);
  return value;
};

/**
 * The block is written as `key: value` lines rather than real YAML so that
 * titles full of colons, quotes or `#` never need escaping. Every line starts
 * with a key, so no value can close the fence early.
 */
export function formatCardBlock(data: CardData): string {
  const lines = ["```" + CARD_LANGUAGE];
  for (const key of FIELDS) {
    const value = data[key];
    if (value === undefined) continue;
    const clean = oneLine(value);
    if (clean !== "") lines.push(`${key}: ${clean}`);
  }
  lines.push("```");
  return lines.join("\n");
}

export function parseCardBlock(source: string): CardData | null {
  const data: Partial<CardData> = {};
  for (const line of source.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    if (!isField(key)) continue;
    const value = unquote(line.slice(colon + 1).trim());
    if (value !== "") data[key] = value;
  }
  return data.url === undefined ? null : { ...data, url: data.url };
}
