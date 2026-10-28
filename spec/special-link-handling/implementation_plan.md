---
status: approved
---

# Special link handling setting

Adds a **Special link handling** setting, on by default. While it's on, a list of sites appears under it, each with its own toggle: **Reddit** and **YouTube** for now. Turning the main setting off makes every link go through the normal page fetch, as if the site-specific code didn't exist. Turning one site off does the same for that site alone.

**Related documents**
- [Reddit post titles plan](../reddit-post-titles/implementation_plan.md)

## User Review Required

> [!IMPORTANT]
> With **Reddit** off, or the main setting off, Reddit links go back to how they were before the Reddit change. A post, a share link and a subreddit page are all titled "Reddit", and only one request is sent, to the link itself. Nothing is sent to Reddit's oEmbed service.

> [!IMPORTANT]
> With **YouTube** off, or the main setting off, new YouTube cards get no `handle:` line. The channel name in `author` is still filled in, because it comes from the page's ordinary author markup, which every site's page is read for. Existing cards don't change, because a card is only fetched once, when it's created.

> [!NOTE]
> All three settings are on by default, so nothing changes for anyone who doesn't touch them. A site added to the list later also starts on, even for people who turned another site off.

> [!NOTE]
> The site list uses toggles, like the plugin's other settings, because Obsidian's settings API has no checkbox control. Each site is its own setting, so a search for "Reddit" or "YouTube" in Obsidian's settings finds it.

> [!NOTE]
> This branch, `feat/special-link-settings`, starts from `feat/reddit-post-titles`, since it switches the Reddit code on and off. It merges after that branch.

## Open Questions

None at this time.

## Proposed Changes

### Settings

#### [MODIFY] `src/settingsData.ts`
- [x] **TASK-1:** Add the settings and the switch they make:
  - Three boolean settings, all defaulting to `true`: `specialLinkHandling`, `specialLinkReddit` and `specialLinkYouTube`. They're kept as separate top-level keys so Obsidian's declarative settings can read and save them directly, and so `resolveSettings` fills in a site added later as on.
  - A `SpecialSites` type, `{ reddit: boolean; youtube: boolean }`, with `ALL_SPECIAL_SITES` (all `true`), and `specialSites(settings)`, which gives each site's setting, or all `false` when `specialLinkHandling` is off.

#### [MODIFY] `src/i18n.ts`
- [x] **TASK-2:** Add English and Japanese strings for the main setting's name and description, the site list's heading, and each site's name and description:
  - **Reddit:** post and share-link titles from Reddit, `u/<poster>` as the author, and `r/<subreddit>` for subreddit pages.
  - **YouTube:** the channel's handle in the card's `handle` line.

#### [MODIFY] `src/settings.ts`
- [x] **TASK-3:** Show the settings in both versions of the tab:
  - **Obsidian 1.13 and later (`getSettingDefinitions`):** the main toggle comes after the existing settings, then a group headed by the site list's heading, holding one toggle per site. The group's `visible` follows `specialLinkHandling`. `setControlValue` is overridden to save as before and then call `refreshDomState()`, so the list appears and disappears as the main toggle changes.
  - **Older versions (`display`):** the same toggles in the same order, with the site toggles indented under the main one. They're only drawn while it's on, and changing it redraws the tab.

### Behavior

#### [MODIFY] `src/fetchMetadata.ts`
- [x] **TASK-4:** `fetchMetadata` takes a fourth parameter, `sites: SpecialSites`, defaulting to `ALL_SPECIAL_SITES`:
  - With `sites.reddit` off, it skips `parseRedditUrl`, so Reddit links take the normal page fetch, making exactly one request.
  - It passes `sites.youtube` on to `extractMetadata`.

#### [MODIFY] `src/metadata.ts`
- [x] **TASK-5:** `extractMetadata(html, pageUrl, youtube = true)` reads a YouTube handle only when `youtube` is on. Everything else, the channel name in `author` included, is read as before.

#### [MODIFY] `main.ts`
- [x] **TASK-6:** `fetchWithNotice` passes `specialSites(this.settings)` to `fetchMetadata`. That one call serves pasting, the paste-and-choose command and converting a link to a card, so all three follow the settings.

### Tests

#### [MODIFY] `tests/settingsData.test.ts`, `tests/reddit.test.ts`, `tests/metadata.test.ts`, `tests/i18n.test.ts` if it checks string keys
- [x] **TASK-7:** Cover, with made-up data only:
  - The new settings default to on, saved values are kept, and data saved before they existed gets them as on.
  - `specialSites` gives each site's own setting, and all off when the main setting is off.
  - With `reddit: false`, a Reddit post, a share link and a subreddit page each make one request, to the link itself, and keep the page's own title.
  - With `youtube: false`, a YouTube video page gets no `handle`, and still gets its `author`.
  - With every site on, which is the default, results are unchanged. The existing tests cover this as they are.

### Docs

#### [MODIFY] `README.md`
- [ ] **TASK-8:** Under **Settings**, describe **Special link handling** and its site list, saying what each site's handling does and what turning it off changes. In **Network use**, note that turning Reddit off stops the request to Reddit's oEmbed service.

#### [MODIFY] `CHANGELOG.md`
- [ ] **TASK-9:** Add an `### Added` entry under `[Unreleased]` for the setting and its site list.

## Verification Plan

### Automated Tests
This repo uses vitest in `tests/` instead of a `scratch/` script.
1. The new cases in the files above pass.
2. Every existing test passes unchanged.
3. `npm run check` passes: typecheck, tests, plugin checks and the production build.

### Manual Verification
In a vault with this build installed, open **Settings → Link or Card**:
1. **Special link handling** is on, with **Reddit** and **YouTube** listed under it, both on.
2. Turn **Special link handling** off. The site list disappears straight away, without leaving the settings. Turn it back on and the list returns, with the sites as you left them.
3. In Obsidian's settings search, type "Reddit". The **Reddit** setting is found.
4. With **Special link handling** off, paste a Reddit post's URL as a **Link**. It's titled "Reddit", as before the Reddit change.
5. Turn **Special link handling** on and **Reddit** off. Paste the post again: it's still titled "Reddit". Turn **Reddit** on and paste it once more: it's titled `<post title> - r/<subreddit>`.
6. With **YouTube** off, paste a YouTube video's URL as a **Card**. The card shows the channel name under the title, and its source has no `handle:` line. Turn **YouTube** on and paste it again: the source has the `handle:` line.
7. Restart Obsidian. The settings are as you left them.
