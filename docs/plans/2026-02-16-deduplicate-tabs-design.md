# Deduplicate Tabs Design

## Problem

In both autopin and monkey-patch modes, opening a note that is already open in another tab creates a duplicate tab. Users end up with the same file open in multiple tabs.

## Solution

Reactive deduplication via the `file-open` event. A single handler runs on every file open, regardless of mode, and redirects to an existing tab if one is found.

## How It Works

1. On `file-open`, get the opened file and the active leaf.
2. Iterate all workspace leaves looking for another leaf with the same file.
3. If a duplicate leaf exists (not the current one): activate it, close the current leaf.
4. If no duplicate: do nothing, let the open proceed normally.

## Integration With Existing Modes

The dedup check runs first in the `file-open` handler. If it redirects to an existing tab, autopin pinning is skipped. If no duplicate is found, autopin proceeds as before. For monkey-patch mode, the dedup handler closes the extra tab that `getLeaf` created.

## Setting

New boolean `deduplicateTabs` (default `true`) in settings, with a toggle in the settings UI.

## Files Changed

- `src/main.ts` — add `deduplicateTab` method, call from unified `file-open` handler
- `src/settings.ts` — add `deduplicateTabs` to interface/defaults, add toggle to settings UI
