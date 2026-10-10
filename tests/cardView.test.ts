// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import "./obsidianDom";
import { renderCard } from "../src/cardView";
import type { CardData } from "../src/cardBlock";

const FULL: CardData = {
  url: "https://example.com/a",
  title: "Title",
  description: "Description",
  image: "https://example.com/og.png",
  favicon: "https://example.com/f.ico",
  site: "Example",
};

const render = (data: CardData | null) => {
  const container = document.createElement("div");
  const onOpen = vi.fn();
  const onMenu = vi.fn();
  renderCard(container, data, { onOpen, onMenu, invalidText: "invalid card" });
  return { container, onOpen, onMenu };
};

describe("renderCard", () => {
  it("renders title, description, host, favicon and thumbnail", () => {
    const { container } = render(FULL);
    const card = container.querySelector<HTMLAnchorElement>("a.loc-card");
    expect(card?.getAttribute("href")).toBe("https://example.com/a");
    expect(container.querySelector(".loc-card-title")?.textContent).toBe("Title");
    expect(container.querySelector(".loc-card-description")?.textContent).toBe("Description");
    expect(container.querySelector(".loc-card-host")?.textContent).toBe("example.com");
    expect(container.querySelector(".loc-card-favicon")?.getAttribute("src")).toBe("https://example.com/f.ico");
    const thumb = container.querySelector(".loc-card-thumb img");
    expect(thumb?.getAttribute("src")).toBe("https://example.com/og.png");
    expect(thumb?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("falls back to the site name, then the host, for the title", () => {
    expect(render({ url: "https://example.com", site: "Example" }).container.querySelector(".loc-card-title")?.textContent).toBe("Example");
    const { container } = render({ url: "https://www.example.com/x" });
    expect(container.querySelector(".loc-card-title")?.textContent).toBe("www.example.com");
    expect(container.querySelector(".loc-card-description")).toBeNull();
    expect(container.querySelector(".loc-card-thumb")).toBeNull();
  });

  it("shows the author under the title, and nothing there when the card has none", () => {
    const { container } = render({ ...FULL, author: "Jane Doe" });
    const author = container.querySelector(".loc-card-author");
    expect(author?.textContent).toBe("Jane Doe");
    expect(author?.previousElementSibling?.className).toBe("loc-card-title");
    expect(author?.nextElementSibling?.className).toBe("loc-card-description");
    expect(render(FULL).container.querySelector(".loc-card-author")).toBeNull();
  });

  it("treats page text as text, never as markup", () => {
    const { container } = render({ url: "https://example.com", title: "<img src=x onerror=alert(1)>", author: "<b>x</b>" });
    expect(container.querySelector(".loc-card-title")?.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(container.querySelector(".loc-card-author")?.textContent).toBe("<b>x</b>");
    expect(container.querySelectorAll("img, b")).toHaveLength(0);
  });

  it("opens the link through onOpen instead of navigating the app window", () => {
    const { container, onOpen } = render(FULL);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    container.querySelector("a.loc-card")?.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onOpen).toHaveBeenCalledWith("https://example.com/a");
  });

  it("hands right-clicks to onMenu", () => {
    const { container, onMenu } = render(FULL);
    container.querySelector("a.loc-card")?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it("drops the thumbnail and favicon when they fail to load", () => {
    const { container } = render(FULL);
    container.querySelector(".loc-card-thumb img")?.dispatchEvent(new Event("error"));
    container.querySelector(".loc-card-favicon")?.dispatchEvent(new Event("error"));
    expect(container.querySelector(".loc-card-thumb")).toBeNull();
    expect(container.querySelector(".loc-card-favicon")).toBeNull();
  });

  it("refuses URLs that are not http(s)", () => {
    const { container } = render({ url: "javascript:alert(1)", title: "x" });
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector(".loc-card-invalid")?.textContent).toBe("invalid card");

    const images = render({ url: "https://example.com", image: "javascript:alert(1)", favicon: "data:image/png;base64,AA" }).container;
    expect(images.querySelectorAll("img")).toHaveLength(0);
  });

  it("shows the invalid message when the block could not be parsed", () => {
    expect(render(null).container.querySelector(".loc-card-invalid")?.textContent).toBe("invalid card");
  });
});
