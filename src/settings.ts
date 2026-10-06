import { PluginSettingTab, Setting } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import type LinkOrCardPlugin from "../main";
import type { Strings } from "./i18n";
import { DEFAULT_SETTINGS } from "./settingsData";
import type { PasteStyle } from "./settingsData";

/** In the order the dropdown lists them. */
const pasteStyleOptions = (t: Strings): Record<PasteStyle, string> => ({
  link: t.menuLink,
  card: t.menuCard,
  plain: t.menuPlain,
  ask: t.pasteStyleAsk,
});

const IGNORED_URLS_PLACEHOLDER = "example.com\ngithub.com/my-org";
const IGNORED_URLS_ROWS = 4;

export class LinkOrCardSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: LinkOrCardPlugin,
  ) {
    super(app, plugin);
  }

  /**
   * Obsidian 1.13+ renders the tab from these definitions and indexes them for
   * settings search; the inherited get/setControlValue read and save
   * `plugin.settings`. Older versions ignore this and call display() below.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    const t = this.plugin.strings;
    return [
      {
        name: t.settingPasteStyleName,
        desc: t.settingPasteStyleDesc,
        control: {
          type: "dropdown",
          key: "pasteStyle",
          defaultValue: DEFAULT_SETTINGS.pasteStyle,
          options: pasteStyleOptions(t),
        },
      },
      {
        name: t.settingIgnoredUrlsName,
        desc: t.settingIgnoredUrlsDesc,
        control: {
          type: "textarea",
          key: "ignoredUrls",
          defaultValue: DEFAULT_SETTINGS.ignoredUrls,
          placeholder: IGNORED_URLS_PLACEHOLDER,
          rows: IGNORED_URLS_ROWS,
        },
      },
      {
        name: t.settingPreserveSelectionName,
        desc: t.settingPreserveSelectionDesc,
        control: {
          type: "toggle",
          key: "preserveSelectionAsTitle",
          defaultValue: DEFAULT_SETTINGS.preserveSelectionAsTitle,
        },
      },
    ];
  }

  /** Fallback for Obsidian versions before 1.13, which do not read getSettingDefinitions(). */
  display(): void {
    const { containerEl } = this;
    const t = this.plugin.strings;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t.settingPasteStyleName)
      .setDesc(t.settingPasteStyleDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(pasteStyleOptions(t))
          .setValue(this.plugin.settings.pasteStyle)
          .onChange(async (value) => {
            this.plugin.settings.pasteStyle = value as PasteStyle;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t.settingIgnoredUrlsName)
      .setDesc(t.settingIgnoredUrlsDesc)
      .addTextArea((area) => {
        area.inputEl.rows = IGNORED_URLS_ROWS;
        area
          .setPlaceholder(IGNORED_URLS_PLACEHOLDER)
          .setValue(this.plugin.settings.ignoredUrls)
          .onChange(async (value) => {
            this.plugin.settings.ignoredUrls = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t.settingPreserveSelectionName)
      .setDesc(t.settingPreserveSelectionDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.preserveSelectionAsTitle).onChange(async (value) => {
          this.plugin.settings.preserveSelectionAsTitle = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
