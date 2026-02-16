# Dual-Mode Auto Pin Design

## Goal

Offer three modes for forcing new files into new tabs:

| Mode | Behavior | API surface |
|---|---|---|
| `disabled` | Plugin does nothing | — |
| `autopin` | Pin active leaf on `file-open` | Official (`setPinned`, `file-open` event) |
| `monkey-patch` | Override `Workspace.getLeaf()` to return new tab leaf | Unofficial (`monkey-around`) |

Default: `autopin`.

## Changes

### `src/settings.ts`
- Replace `enabled: boolean` with `mode: "disabled" | "autopin" | "monkey-patch"`
- Dropdown setting with descriptions for each mode

### `src/main.ts`
- `file-open` handler checks `mode === "autopin"` before pinning
- Monkey-patch installed/uninstalled dynamically when mode changes
- `monkey-around` wraps `Workspace.prototype.getLeaf`: when called with `false`/`undefined`, returns `getLeaf('tab')` instead
- Ribbon icon and command cycle through: disabled → autopin → monkey-patch → disabled
- Cleanup function stored on plugin instance; called on mode switch and plugin unload

### Dependencies
- Add `monkey-around` npm package

## Decisions
- No tab cleanup on mode switch (tabs left as-is)
- Settings UI shows trade-off descriptions for each mode
