import { PluginSettingTab, Setting } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import type LinkOrCardPlugin from "../main";

export interface LinkOrCardSettings {
  askOnPaste: boolean;
  /** One entry per line, as typed; see isIgnoredUrl() for how an entry matches. */
  ignoredUrls: string;
}

export const DEFAULT_SETTINGS: LinkOrCardSettings = {
  askOnPaste: true,
  ignoredUrls: "",
};

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
        name: t.settingAskOnPasteName,
        desc: t.settingAskOnPasteDesc,
        control: { type: "toggle", key: "askOnPaste", defaultValue: DEFAULT_SETTINGS.askOnPaste },
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
    ];
  }

  /** Fallback for Obsidian versions before 1.13, which do not read getSettingDefinitions(). */
  display(): void {
    const { containerEl } = this;
    const t = this.plugin.strings;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t.settingAskOnPasteName)
      .setDesc(t.settingAskOnPasteDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.askOnPaste).onChange(async (value) => {
          this.plugin.settings.askOnPaste = value;
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
  }
}
