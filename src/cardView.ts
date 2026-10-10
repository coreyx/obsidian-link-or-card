import type { CardData } from "./cardBlock";
import { safeHttpUrl } from "./url";

export interface CardViewOptions {
  onOpen(url: string): void;
  onMenu(event: MouseEvent): void;
  invalidText: string;
}

const imageAttrs = (src: string) => ({ src, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });

/**
 * Builds the card through createEl's `text` and `attr` only. Everything in a
 * card came from a web page, so none of it may be parsed as markup.
 */
export function renderCard(container: HTMLElement, data: CardData | null, options: CardViewOptions): void {
  const url = safeHttpUrl(data?.url);
  if (data === null || url === null) {
    container.createDiv({ cls: "loc-card-invalid", text: options.invalidText });
    return;
  }
  const host = new URL(url).hostname;

  const card = container.createEl("a", { cls: "loc-card", attr: { href: url, "aria-label": url } });
  card.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onOpen(url);
  });
  card.addEventListener("contextmenu", (event) => options.onMenu(event));

  const body = card.createDiv({ cls: "loc-card-body" });
  body.createDiv({ cls: "loc-card-title", text: data.title ?? data.site ?? host });
  if (data.author !== undefined) body.createDiv({ cls: "loc-card-author", text: data.author });
  if (data.description !== undefined) body.createDiv({ cls: "loc-card-description", text: data.description });

  const meta = body.createDiv({ cls: "loc-card-meta" });
  const favicon = safeHttpUrl(data.favicon);
  if (favicon !== null) {
    const icon = meta.createEl("img", { cls: "loc-card-favicon", attr: imageAttrs(favicon) });
    icon.addEventListener("error", () => icon.remove());
  }
  meta.createSpan({ cls: "loc-card-host", text: host });

  const image = safeHttpUrl(data.image);
  if (image !== null) {
    const thumb = card.createDiv({ cls: "loc-card-thumb" });
    thumb.createEl("img", { attr: imageAttrs(image) }).addEventListener("error", () => thumb.remove());
  }
}
