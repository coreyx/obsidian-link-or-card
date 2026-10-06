# Changelog

All notable changes to this plugin are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-10-05

### Added

- **Preserve selection as title** setting, on by default. Pasting a URL over selected text turns the selection into a link titled with that text and opens the menu; choosing **Card** uses the selected text as the card title instead of the fetched one. Turn the setting off to leave pastes over a selection to Obsidian, as before.

## [0.2.0] - 2026-10-05

### Added

- **Don't ask for these URLs** setting: a list of URLs, one per line, that paste normally without the menu. An entry is a domain, which also covers its subdomains, and can be narrowed with a path (`github.com/my-org`) or a port (`localhost:3000`). The right-click menu and the command still work on these URLs.
- README instructions for installing with BRAT.

## [0.1.1] - 2026-10-01

Addresses the warnings from the community-plugin review of 0.1.0.

### Added

- The settings tab is declared with `getSettingDefinitions()`, so its settings show up in settings search on Obsidian 1.13 and later. Older versions keep the previous tab.
- Release builds publish a build provenance attestation for `main.js`, `manifest.json` and `styles.css`.

### Changed

- Cards are built with Obsidian's `createEl` helpers instead of `document.createElement`.

### Fixed

- Timers are created on `window`, so they run in popout windows.
- A metadata request that times out now always rejects with an `Error`.

## [0.1.0] - 2026-09-30

First release.

### Added

- A menu when pasting a URL, offering **Card**, **Link** or **Plain URL**. The URL is pasted right away, so closing the menu leaves an ordinary paste.
- Link cards stored as `linkcard` code blocks, with the page title, description, thumbnail and site icon fetched once when the card is created.
- Markdown links with the page title filled in.
- Converting between a card, a link and a plain URL from the right-click menu or the command **Change link style at cursor**.
- **Ask when pasting a URL** setting.
- English and Japanese interface text.

[Unreleased]: https://github.com/coreyx/obsidian-link-or-card/compare/0.3.0...HEAD
[0.3.0]: https://github.com/coreyx/obsidian-link-or-card/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/coreyx/obsidian-link-or-card/releases/tag/0.2.0
[0.1.1]: https://github.com/yut0takagi/obsidian-link-or-card/releases/tag/0.1.1
[0.1.0]: https://github.com/yut0takagi/obsidian-link-or-card/releases/tag/0.1.0
