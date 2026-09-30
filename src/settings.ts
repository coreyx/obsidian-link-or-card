import { PluginSettingTab, Setting } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import type LinkOrCardPlugin from "../main";

export interface LinkOrCardSettings {
  askOnPaste: boolean;
}

export const DEFAULT_SETTINGS: LinkOrCardSettings = {
  askOnPaste: true,
};

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
  }
}
