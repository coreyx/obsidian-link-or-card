/** What a pasted URL becomes: one of the three styles straight away, or a menu to choose from. */
export type PasteStyle = "link" | "card" | "plain" | "ask";

export interface LinkOrCardSettings {
  pasteStyle: PasteStyle;
  /** One entry per line, as typed; see isIgnoredUrl() for how an entry matches. */
  ignoredUrls: string;
  preserveSelectionAsTitle: boolean;
}

export const DEFAULT_SETTINGS: LinkOrCardSettings = {
  pasteStyle: "link",
  ignoredUrls: "",
  preserveSelectionAsTitle: true,
};

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
