/** What a pasted URL becomes: one of the three styles straight away, or a menu to choose from. */
export type PasteStyle = "link" | "card" | "plain" | "ask";

export interface LinkOrCardSettings {
  pasteStyle: PasteStyle;
  /** One entry per line, as typed; see isIgnoredUrl() for how an entry matches. */
  ignoredUrls: string;
  preserveSelectionAsTitle: boolean;
  /**
   * Whether any site gets its own handling. Each site's switch is a separate
   * top-level key, rather than one nested object, so the declarative settings tab
   * can read and save it directly, and resolveSettings() turns a site added later
   * on for everyone.
   */
  specialLinkHandling: boolean;
  specialLinkReddit: boolean;
  specialLinkYouTube: boolean;
}

export const DEFAULT_SETTINGS: LinkOrCardSettings = {
  pasteStyle: "link",
  ignoredUrls: "",
  preserveSelectionAsTitle: true,
  specialLinkHandling: true,
  specialLinkReddit: true,
  specialLinkYouTube: true,
};

/** Which sites get their own handling instead of only the normal page fetch. */
export interface SpecialSites {
  /** Post, share-link and subreddit titles from Reddit itself. */
  reddit: boolean;
  /** The channel's handle in a YouTube card's `handle` line. */
  youtube: boolean;
}

export const ALL_SPECIAL_SITES: SpecialSites = { reddit: true, youtube: true };

/** Each site's own switch, or every site off while special link handling is off. */
export function specialSites(settings: LinkOrCardSettings): SpecialSites {
  const on = settings.specialLinkHandling;
  return { reddit: on && settings.specialLinkReddit, youtube: on && settings.specialLinkYouTube };
}

const PASTE_STYLES: readonly unknown[] = ["link", "card", "plain", "ask"];

/**
 * Saved data laid over the defaults. Up to 0.3.0 the paste style was an on/off
 * toggle, `askOnPaste`; having turned it off meant "leave my pastes alone", and
 * still does. Anyone else gets the default.
 */
export function resolveSettings(saved: unknown): LinkOrCardSettings {
  const { askOnPaste, ...rest } = (saved ?? {}) as Partial<LinkOrCardSettings> & { askOnPaste?: unknown };
  const settings = { ...DEFAULT_SETTINGS, ...rest };
  if (!PASTE_STYLES.includes(rest.pasteStyle)) {
    settings.pasteStyle = askOnPaste === false ? "plain" : DEFAULT_SETTINGS.pasteStyle;
  }
  return settings;
}
