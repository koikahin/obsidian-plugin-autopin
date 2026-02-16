import {FileView, Notice, Plugin, TFile, WorkspaceLeaf} from 'obsidian';
import {around} from 'monkey-around';
import {AutoPinMode, AutoPinSettings, AutoPinSettingTab, DEFAULT_SETTINGS} from "./settings";

const MODE_CYCLE: AutoPinMode[] = ["disabled", "autopin", "monkey-patch"];

const MODE_LABELS: Record<AutoPinMode, string> = {
	"disabled": "disabled",
	"autopin": "auto-pin",
	"monkey-patch": "monkey-patch",
};

export default class AutoPinPlugin extends Plugin {
	settings: AutoPinSettings;
	private uninstallMonkeyPatch: (() => void) | null = null;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (this.settings.mode === "disabled") return;
				if (!file) return;

				if (this.deduplicateTab(file)) return;

				if (this.settings.mode === "autopin") {
					const leaf = this.app.workspace.activeLeaf;
					if (leaf) {
						leaf.setPinned(true);
					}
				}
			})
		);

		this.addRibbonIcon('pin', 'Cycle Auto Pin mode', () => {
			this.cycleMode();
		});

		this.addCommand({
			id: 'cycle-mode',
			name: 'Cycle mode (disabled → auto-pin → monkey-patch)',
			callback: () => {
				this.cycleMode();
			}
		});

		this.addSettingTab(new AutoPinSettingTab(this.app, this));

		this.applyMode();
	}

	onunload() {
		this.removeMonkeyPatch();
	}

	applyMode() {
		if (this.settings.mode === "monkey-patch") {
			this.installMonkeyPatch();
		} else {
			this.removeMonkeyPatch();
		}
	}

	private installMonkeyPatch() {
		if (this.uninstallMonkeyPatch) return;

		this.uninstallMonkeyPatch = around(this.app.workspace, {
			getLeaf(next) {
				return function (this: any, newLeaf?: any, direction?: any) {
					if (newLeaf === false || newLeaf === undefined) {
						newLeaf = 'tab';
					}
					return (next as any).call(this, newLeaf, direction);
				} as typeof next;
			}
		});
	}

	private removeMonkeyPatch() {
		if (this.uninstallMonkeyPatch) {
			this.uninstallMonkeyPatch();
			this.uninstallMonkeyPatch = null;
		}
	}

	/**
	 * If the file is already open in another leaf, focus that leaf
	 * and close the current (duplicate) one.
	 * Returns true if a duplicate was found and handled.
	 */
	private deduplicateTab(file: TFile): boolean {
		if (!this.settings.deduplicateTabs) return false;

		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) return false;

		let existingLeaf: WorkspaceLeaf | null = null;

		// iterateAllLeaves has no early-exit mechanism, so we scan all leaves.
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf === activeLeaf) return;
			if (leaf.view instanceof FileView && leaf.view.file?.path === file.path) {
				existingLeaf = leaf;
			}
		});

		if (existingLeaf) {
			this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
			activeLeaf.detach();
			return true;
		}

		return false;
	}

	private cycleMode() {
		const currentIndex = MODE_CYCLE.indexOf(this.settings.mode);
		const nextIndex = (currentIndex + 1) % MODE_CYCLE.length;
		this.settings.mode = MODE_CYCLE[nextIndex] ?? DEFAULT_SETTINGS.mode;
		this.saveSettings();
		this.applyMode();
		new Notice(`Auto Pin: ${MODE_LABELS[this.settings.mode]}`);
	}

	async loadSettings() {
		const data = await this.loadData() as Partial<AutoPinSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

		// Migrate old boolean `enabled` setting
		if (data && 'enabled' in data) {
			this.settings.mode = (data as any).enabled ? "autopin" : "disabled";
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
