import {Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, AutoPinSettings, AutoPinSettingTab} from "./settings";

export default class AutoPinPlugin extends Plugin {
	settings: AutoPinSettings;

	async onload() {
		await this.loadSettings();

		// Pin the active leaf whenever a file is opened
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (!this.settings.enabled) return;
				if (!file) return;

				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					leaf.setPinned(true);
				}
			})
		);

		// Ribbon icon to toggle auto-pin on/off
		this.addRibbonIcon('pin', 'Toggle Auto Pin', () => {
			this.settings.enabled = !this.settings.enabled;
			this.saveSettings();
			new Notice(`Auto Pin: ${this.settings.enabled ? 'enabled' : 'disabled'}`);
		});

		// Command to toggle auto-pin on/off
		this.addCommand({
			id: 'toggle-autopin',
			name: 'Toggle auto-pin',
			callback: () => {
				this.settings.enabled = !this.settings.enabled;
				this.saveSettings();
				new Notice(`Auto Pin: ${this.settings.enabled ? 'enabled' : 'disabled'}`);
			}
		});

		// Settings tab
		this.addSettingTab(new AutoPinSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<AutoPinSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
