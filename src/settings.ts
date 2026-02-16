import {App, PluginSettingTab, Setting} from "obsidian";
import AutoPinPlugin from "./main";

export interface AutoPinSettings {
	enabled: boolean;
}

export const DEFAULT_SETTINGS: AutoPinSettings = {
	enabled: true
}

export class AutoPinSettingTab extends PluginSettingTab {
	plugin: AutoPinPlugin;

	constructor(app: App, plugin: AutoPinPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Auto-pin tabs')
			.setDesc('Automatically pin tabs when files are opened, so new files always open in a new tab.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabled)
				.onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				}));
	}
}
