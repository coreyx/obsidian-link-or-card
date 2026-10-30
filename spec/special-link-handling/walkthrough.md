# Walkthrough: Special Link Handling

A new **Special link handling** setting, on by default, switches off the plugin's site-specific code. While it's on, a list of sites appears under it, **Reddit** and **YouTube**, each with its own toggle. A site that's off, or every site while the main setting is off, goes through the normal page fetch, as before its handling existed.

## What Was Implemented

### 1. Settings
- **`src/settingsData.ts`** (efe071b): Three settings, all on by default: `specialLinkHandling`, `specialLinkReddit` and `specialLinkYouTube`. They're separate top-level keys, so Obsidian's declarative settings can save them directly and a site added later starts on. `specialSites(settings)` turns them into `{ reddit, youtube }`, all off while the main setting is off.
- **`src/i18n.ts`** (57e83ec): English and Japanese names and descriptions for the main setting, the site list's heading and each site.
- **`src/settings.ts`** (91db7e4):
  - **Obsidian 1.13 and later:** the main toggle, then a group of site toggles whose `visible` follows it. `setControlValue` saves as before and then calls `refreshDomState()`, so the list shows and hides as the toggle changes.
  - **Older versions:** the same toggles, with the sites drawn only while the main toggle is on, and the tab redrawn when it changes.

### 2. Behavior
- **`src/metadata.ts`** (55ceb94): `extractMetadata` takes a `youtube` switch. Off, no YouTube handle is read; the channel name in `author` still is.
- **`src/fetchMetadata.ts`** (87d6001): `fetchMetadata` takes the sites as a fourth parameter, defaulting to all on. With Reddit off, it never calls `parseRedditUrl`, so a Reddit link gets one request, to the link itself. It passes the YouTube switch to `extractMetadata`.
- **`main.ts`** (4dd1ba1): `fetchWithNotice` passes `specialSites(this.settings)`. It's the one call behind pasting, the paste-and-choose command and converting to a card.

### 3. Tests and docs
- **Tests** (efe071b, 53324ad):
  - `tests/settingsData.test.ts` covers the defaults and `specialSites`. Its existing "keeps what was saved" test now saves the new settings too.
  - `tests/reddit.test.ts` covers Reddit switched off, and `tests/metadata.test.ts` covers YouTube switched off.
  - The existing strings test checks that both languages have every new key.
- **`README.md`** (8de40fa): **Settings** describes the setting and has a table of the sites. **Network use** says that turning Reddit off stops the oEmbed request.
- **`CHANGELOG.md`** (6376c1f): an `Added` entry under `[Unreleased]`.

**Changes from the plan:**
- **TASK-5 was done before TASK-4,** because TASK-4 passes the YouTube switch to the parameter TASK-5 adds.
- **On Obsidian versions before 1.13, the site list sits under a heading** instead of being indented. That matches the group heading 1.13 draws, and needs no extra CSS.

## Verification & Test Results

### Automated Tests
Ran `npx vitest run`. All 130 tests passed:
- **Defaults:** every site is on by default, including for settings saved before these existed. **Passed**
- **`specialSites`:** follows each site's own setting, and turns every site off while the main setting is off, whatever the sites say. **Passed**
- **Reddit off:** a post, a share link and a subreddit page are each titled "Reddit", with one request to the link itself and none to oEmbed. A failed page request gives null, with no slug guess. **Passed**
- **YouTube off:** a video keeps its channel name as `author` and gets no `handle`. A channel page pasted by its handle gets none either. **Passed**
- **Everything on:** every existing test passed unchanged. **Passed**

**Mutation check.** Three small breaks were made, one at a time, and each file was restored afterwards:
- `fetchMetadata` ignoring the Reddit switch failed 2 tests.
- `specialSites` ignoring the main switch failed 1.
- `extractMetadata` ignoring the YouTube switch failed 1.

### Regression Testing
Ran `npm run check`: typecheck, all 130 tests in 10 files, plugin checks for 12 source files, and the production build. **Passed**

The settings tab itself has no automated test, since it needs Obsidian to render. The manual steps below cover it.

## Manual Verification
In a vault with this build installed, open **Settings → Link or Card**:
1. **Special link handling** is on, with **Reddit** and **YouTube** listed under it, both on.
2. Turn **Special link handling** off. The site list disappears straight away, without leaving the settings. Turn it back on and the list returns, with the sites as you left them.
3. In Obsidian's settings search, type "Reddit". The **Reddit** setting is found.
4. With **Special link handling** off, paste a Reddit post's URL as a **Link**. It's titled "Reddit", as before the Reddit change.
5. Turn **Special link handling** on and **Reddit** off. Paste the post again: it's still titled "Reddit". Turn **Reddit** on and paste it once more: it's titled `<post title> - r/<subreddit>`.
6. With **YouTube** off, paste a YouTube video's URL as a **Card**. The card shows the channel name under the title, and its source has no `handle:` line. Turn **YouTube** on and paste it again: the source has the `handle:` line.
7. Restart Obsidian. The settings are as you left them.

**Result:** The maintainer ran all 7 steps in Obsidian, and all 7 passed.

## Follow-ups
None.
