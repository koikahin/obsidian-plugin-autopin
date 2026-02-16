> [!WARNING] 
> This is a scrappy, vibe-coded, barely-reviewed, barely-tested project that doesn't follow good software engineering practices! I've put the least effort needed to get this to work and address a pain point. Review before use and use it at your own risk. Make sure to have regular backups of your vault as this plugin may crash and burn your vault at any time without notice.

# Auto Pin

Obsidian plugin that automatically pins tabs when files are opened.

## Why

Obsidian reuses the current tab when opening a file. There's no built-in setting to change this. A common workaround is to Ctrl/Cmd-click every link, which works differently than most other Electron based desktop apps that I'm used to. 

## How it works

Instead of monkey-patching internal APIs, this plugin uses a simple trick: it auto-pins every tab on file open. Pinned tabs can't be replaced — Obsidian's own tab logic forces the next file into a new tab. This means the plugin relies entirely on official APIs (`WorkspaceLeaf.setPinned()` and the `file-open` event), making it resilient to Obsidian updates.

Auto-pinning can be toggled via the command palette, a ribbon icon, or the plugin settings.

## Build

```sh
npm install
npm run build
```

This produces `main.js` in the project root.

## Install

1. Build the plugin (see above).
2. Create a folder in your vault: `.obsidian/plugins/autopin/`
3. Copy these files into it:
   - `main.js`
   - `manifest.json`
   - `styles.css` (if present)
4. Restart Obsidian (or reload plugins).
5. Enable **Auto Pin** in Settings → Community plugins.
