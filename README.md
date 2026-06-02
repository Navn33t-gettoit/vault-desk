# Vault Desk

A local-first desktop interface for Obsidian Vaults.

Vault Desk provides a clean, distraction-free frontend for reading and writing Markdown notes while keeping your vault as the source of truth. Every edit made inside Vault Desk is written directly back to your raw `.md` files in real time.

### Privacy First

Your vault stays on your machine.

Vault Desk reads notes directly from your local filesystem and does not require a database, cloud sync service, or external account. Your notes, filenames, and personal data never leave your device.

### Themes

Choose between three distinct workspace styles:

* **Midnight** — High-contrast dark workspace.
* **Paper** — Warm, document-inspired reading experience.
* **Imperial Datapad** — Monochrome terminal-inspired interface with a retro tactical aesthetic.

### Features

* **Initialization Scan** — Point Vault Desk at any local vault path; it discovers notes and groups them by top-level topic folders automatically. Loose root-level `.md` files are categorized under **Root**.
* **Topic Navigation** — Filter the dashboard by major categories (`All`, `Root`, and each top-level folder) after scanning.
* **Real-Time Bi-Directional Sync** — Changes are instantly reflected in your underlying Obsidian Markdown files.
* **Visual Workspace Organization** — Drag and drop note cards to reorder and bundle notes into custom sub-vault layouts (UI-only; files on disk are never moved).
* **Contextual Typography Scaling** — Adjust workspace density and reading comfort instantly from the note editor.
* **Live Reading Metrics** — Word count and reading time update in real time.

### Getting Started

1. Clone this repository.
2. Run `npm install`.
3. Start the app with `npm run dev` and open the local URL shown in your terminal.
4. On the dashboard, enter your Obsidian vault path (e.g. `/Users/you/Documents/MyVault`) and click **Scan vault**.
5. Browse notes by topic tab, open a note to edit, and toggle themes from the global header.

Scan results are saved in browser `localStorage`; the active vault path is persisted server-side in `.vault-desk/config.json` (gitignored) so note read/write uses your scanned directory.

### API

| Endpoint | Method | Description |
|---|---|---|
| `/api/scan` | `POST` | Accepts `{ "vaultPath": "/path/to/vault" }`. Returns topics, note count, and a flat list of notes with `title`, `slug`, `topic`, and `relativePath`. |
| `/api/save` | `POST` | Accepts `{ "slug", "content" }`. Writes edited markdown back to the configured vault on disk. |

### Why I Built It

I love Obsidian because my notes are plain files that I fully own.

Vault Desk started as an experiment to create a different way of interacting with those files without giving up the simplicity, portability, and privacy of a local Markdown vault.
