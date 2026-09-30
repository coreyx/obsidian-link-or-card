/**
 * Obsidian adds createEl / createDiv / createSpan to every element at runtime.
 * jsdom has none of them, so tests that render DOM install this minimal
 * stand-in, covering only the DomElementInfo fields the plugin uses.
 */
interface DomElementInfo {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | number | boolean | null>;
}

function createEl(this: HTMLElement, tag: string, info: DomElementInfo = {}): HTMLElement {
  const el = this.ownerDocument.createElement(tag);
  if (info.cls !== undefined) el.className = Array.isArray(info.cls) ? info.cls.join(" ") : info.cls;
  if (info.text !== undefined) el.textContent = info.text;
  for (const [name, value] of Object.entries(info.attr ?? {})) {
    if (value !== null && value !== false) el.setAttribute(name, String(value));
  }
  this.appendChild(el);
  return el;
}

const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
proto.createEl = createEl;
proto.createDiv = function (this: HTMLElement, info?: DomElementInfo) {
  return createEl.call(this, "div", info);
};
proto.createSpan = function (this: HTMLElement, info?: DomElementInfo) {
  return createEl.call(this, "span", info);
};
