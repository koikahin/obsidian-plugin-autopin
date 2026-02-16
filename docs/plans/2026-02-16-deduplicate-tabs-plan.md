# Deduplicate Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent the same file from being open in multiple tabs by redirecting to the existing tab.

**Architecture:** A single `file-open` event handler calls a `deduplicateTab` method that scans all workspace leaves. If a duplicate is found, it activates the existing leaf and detaches the new one. This runs before mode-specific logic (autopin pinning), so dedup is shared across all modes.

**Tech Stack:** Obsidian Plugin API (`iterateAllLeaves`, `setActiveLeaf`, `detach`, `FileView`)

---

### Task 1: Add `deduplicateTabs` setting

**Files:**
- Modify: `src/settings.ts:6-12` (interface + defaults)

**Step 1: Add the setting to the interface and defaults**

In `src/settings.ts`, add `deduplicateTabs: boolean` to `AutoPinSettings` and set it to `true` in `DEFAULT_SETTINGS`:

```ts
export interface AutoPinSettings {
	mode: AutoPinMode;
	deduplicateTabs: boolean;
}

export const DEFAULT_SETTINGS: AutoPinSettings = {
	mode: "autopin",
	deduplicateTabs: true,
}
```

**Step 2: Build to check for type errors**

Run: `npm run build`
Expected: Success (no consumers of the new field yet)

**Step 3: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add deduplicateTabs setting to interface and defaults"
```

---

### Task 2: Add settings UI toggle

**Files:**
- Modify: `src/settings.ts:28-48` (display method)

**Step 1: Add toggle to settings tab**

In the `display()` method of `AutoPinSettingTab`, after the existing dropdown `Setting`, add:

```ts
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
```

**Step 2: Build to check for type errors**

Run: `npm run build`
Expected: Success

**Step 3: Commit**

```bash
git add src/settings.ts
git commit -m "feat: add deduplicate tabs toggle to settings UI"
```

---

### Task 3: Implement dedup logic and refactor file-open handler

**Files:**
- Modify: `src/main.ts:1` (add `FileView` import)
- Modify: `src/main.ts:20-30` (refactor `file-open` handler)
- Modify: `src/main.ts` (add `deduplicateTab` method)

**Step 1: Add `FileView` to the import**

Change line 1 of `src/main.ts`:

```ts
import {FileView, Notice, Plugin} from 'obsidian';
```

**Step 2: Add the `deduplicateTab` method**

Add this private method to the `AutoPinPlugin` class (after `removeMonkeyPatch`, before `cycleMode`):

```ts
/**
 * If the file is already open in another leaf, focus that leaf
 * and close the current (duplicate) one.
 * Returns true if a duplicate was found and handled.
 */
private deduplicateTab(file: import('obsidian').TFile): boolean {
	if (!this.settings.deduplicateTabs) return false;

	const activeLeaf = this.app.workspace.activeLeaf;
	if (!activeLeaf) return false;

	let existingLeaf: import('obsidian').WorkspaceLeaf | null = null;

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
```

**Step 3: Refactor the `file-open` handler**

Replace the existing `file-open` handler (lines 20-30) with:

```ts
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
```

Key points:
- Dedup runs for both `autopin` and `monkey-patch` modes (only skipped when `disabled`)
- If dedup handled it, we return early — no pinning needed
- Autopin pinning only runs if no duplicate was found

**Step 4: Build to check for type errors**

Run: `npm run build`
Expected: Success

**Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: deduplicate tabs on file open across all modes"
```

---

### Task 4: Manual smoke test

No automated tests exist in this project. Verify manually in Obsidian:

1. Enable plugin, set mode to **autopin**
2. Open file A → opens in a tab, gets pinned
3. Open file B → opens in a new tab, gets pinned
4. Click file A again (from file tree or editor link) → should focus the existing tab A, NOT create a third tab
5. Switch mode to **monkey-patch**, repeat steps 2-4 → same dedup behavior
6. Go to settings, toggle **Deduplicate tabs** OFF
7. Click file A again → should now open a duplicate tab (dedup disabled)
8. Toggle it back ON, verify dedup resumes
