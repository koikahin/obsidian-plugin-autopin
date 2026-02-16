import {App, PluginSettingTab, Setting} from "obsidian";
import AutoPinPlugin from "./main";

export type AutoPinMode = "disabled" | "autopin" | "monkey-patch";

export interface AutoPinSettings {
	mode: AutoPinMode;
	deduplicateTabs: boolean;
}

export const DEFAULT_SETTINGS: AutoPinSettings = {
	mode: "autopin",
	deduplicateTabs: true,
}

const MODE_OPTIONS: Record<AutoPinMode, string> = {
	"disabled": "Disabled — plugin does nothing",
	"autopin": "Auto Pin — uses official APIs, tabs show a pin icon",
	"monkey-patch": "Monkey Patch — overrides internal behavior, no pin icons, may break on Obsidian updates",
};

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
			.setName('New tab behavior')
			.setDesc('Choose how the plugin forces new files to open in a new tab.')
			.addDropdown(dropdown => {
				for (const [value, label] of Object.entries(MODE_OPTIONS)) {
					dropdown.addOption(value, label);
				}
				dropdown
					.setValue(this.plugin.settings.mode)
					.onChange(async (value) => {
						this.plugin.settings.mode = value as AutoPinMode;
						await this.plugin.saveSettings();
						this.plugin.applyMode();
					});
			});

		new Setting(containerEl)
			.setName('Deduplicate tabs')
			.setDesc('When opening a file that is already open in another tab, focus the existing tab instead of opening a duplicate.')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.deduplicateTabs)
					.onChange(async (value) => {
						this.plugin.settings.deduplicateTabs = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
