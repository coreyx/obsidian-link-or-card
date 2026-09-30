import { PluginSettingTab, Setting } from "obsidian";
import type { App } from "obsidian";
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
