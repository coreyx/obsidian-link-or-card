import type { CardData } from "./cardBlock";
import { safeHttpUrl } from "./url";

export interface CardViewOptions {
  onOpen(url: string): void;
  onMenu(event: MouseEvent): void;
  invalidText: string;
}

/**
 * Builds the card with createElement/textContent only. Everything in a card
 * came from a web page, so none of it may be parsed as markup.
 */
export function renderCard(container: HTMLElement, data: CardData | null, options: CardViewOptions): void {
  const doc = container.ownerDocument;
  const add = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent: HTMLElement) => {
    const node = doc.createElement(tag);
    if (className !== "") node.className = className;
    parent.appendChild(node);
    return node;
  };
  const addImage = (className: string, src: string, parent: HTMLElement) => {
    const img = add("img", className, parent);
    img.setAttribute("src", src);
    img.setAttribute("alt", "");
    img.setAttribute("loading", "lazy");
    img.setAttribute("referrerpolicy", "no-referrer");
    return img;
  };

  const url = safeHttpUrl(data?.url);
  if (data === null || url === null) {
    add("div", "loc-card-invalid", container).textContent = options.invalidText;
    return;
  }
  const host = new URL(url).hostname;

  const card = add("a", "loc-card", container);
  card.setAttribute("href", url);
  card.setAttribute("aria-label", url);
  card.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onOpen(url);
  });
  card.addEventListener("contextmenu", (event) => options.onMenu(event));

  const body = add("div", "loc-card-body", card);
  add("div", "loc-card-title", body).textContent = data.title ?? data.site ?? host;
  if (data.description !== undefined) add("div", "loc-card-description", body).textContent = data.description;

  const meta = add("div", "loc-card-meta", body);
  const favicon = safeHttpUrl(data.favicon);
  if (favicon !== null) {
    const icon = addImage("loc-card-favicon", favicon, meta);
    icon.addEventListener("error", () => icon.remove());
  }
  add("span", "loc-card-host", meta).textContent = host;

  const image = safeHttpUrl(data.image);
  if (image !== null) {
    const thumb = add("div", "loc-card-thumb", card);
    addImage("", image, thumb).addEventListener("error", () => thumb.remove());
  }
}
