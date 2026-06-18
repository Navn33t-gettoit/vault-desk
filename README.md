# Vault Desk

A local-first desktop interface for Obsidian Vaults.

Vault Desk provides a clean, distraction-free frontend for reading and writing Markdown notes while keeping your vault as the source of truth. Every edit made inside Vault Desk is written directly back to your raw `.md` files in real time.

**Home address:** [http://127.0.0.1:7423](http://127.0.0.1:7423) — always the same on every machine.

### Privacy First

Your vault stays on your machine.

Vault Desk reads notes directly from your local filesystem and does not require a database, cloud sync service, or external account. Your notes, filenames, and personal data never leave your device.

### Themes

Choose between three distinct workspace styles:

* **Midnight** — High-contrast dark workspace.
* **Paper** — Warm, document-inspired reading experience.
* **Imperial Datapad** — Monochrome terminal-inspired interface with a retro tactical aesthetic.

### Features

* **Desktop App** — Double-click to launch a native window. No terminal needed after setup. Always opens at [http://127.0.0.1:7423](http://127.0.0.1:7423).
* **Initialization Scan** — Point Vault Desk at any local vault path; it discovers notes and groups them by top-level topic folders automatically. Loose root-level `.md` files are categorized under **Root**.
* **Topic Navigation** — Filter the dashboard by major categories (`All`, `Root`, and each top-level folder) after scanning.
* **Real-Time Bi-Directional Sync** — Changes are instantly reflected in your underlying Obsidian Markdown files.
* **Visual Workspace Organization** — Drag and drop note cards to reorder and bundle notes into custom sub-vault layouts (UI-only; files on disk are never moved).
* **Contextual Typography Scaling** — Adjust workspace density and reading comfort instantly from the note editor.
* **Live Reading Metrics** — Word count and reading time update in real time.

---

### Launch the app

**Requirements:** [Node.js 20+](https://nodejs.org)

#### Option 1 — Double-click (easiest)

| Platform | File | Notes |
|---|---|---|
| macOS | `Vault Desk.app` | **Recommended** — opens without Terminal |
| macOS | `Launch Vault Desk.command` | Opens Terminal (useful for seeing logs) |
| Windows | `Launch Vault Desk.bat` | |
| Linux | `launch-vault-desk.sh` | |

First launch installs dependencies and builds the app automatically (~1 minute). Later launches open the desktop window instantly.

> **macOS:** If Gatekeeper blocks the app, right-click it → **Open** → **Open** once.

#### Option 2 — Terminal

```bash
git clone https://github.com/Navn33t-gettoit/vault-desk.git
cd vault-desk
npm install
npm run app
```

#### Option 3 — Browser only (development)

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:7423](http://127.0.0.1:7423).

---

### First-time setup

1. Launch Vault Desk using one of the methods above.
2. On the dashboard, enter your Obsidian vault path (e.g. `/Users/you/Documents/MyVault`) and click **Scan vault**.
3. Your vault is scanned and notes appear grouped by topic. The path is saved — future launches go straight to your dashboard.
4. Browse notes by topic tab, open a note to edit, and toggle themes from the global header.

After the first scan, the vault path bar collapses to a compact one-liner. Click **Change** any time to point Vault Desk at a different vault.

---

### Changing the port

Edit `app.config.cjs` in the project root:

```js
const APP_PORT = 7423; // ← change this if the port is taken
```

Then rebuild: `npm run build`. The new port takes effect on next launch.

To expose Vault Desk on your local network (e.g. access from another device on the same Wi-Fi):

```js
const APP_HOST = "0.0.0.0";
```

---

### Environment variables

| Variable | Description |
|---|---|
| `VAULT_PATH` | Pre-set the vault path without going through the scan UI. Overrides any saved config. |

Example:

```bash
VAULT_PATH=~/Documents/MyVault npm run app
```

---

### npm scripts

| Command | Description |
|---|---|
| `npm run app` | Build (if needed) and open the desktop app |
| `npm run dev` | Development server at http://127.0.0.1:7423 |
| `npm run build` | Production build |
| `npm run start` | Start production server (used internally by the desktop app) |

---

### API

| Endpoint | Method | Description |
|---|---|---|
| `/api/scan` | `POST` | Accepts `{ "vaultPath": "/path/to/vault" }`. Returns topics, note count, and a flat list of notes with `title`, `slug`, `topic`, and `relativePath`. |
| `/api/save` | `POST` | Accepts `{ "slug", "content" }`. Writes edited markdown back to the configured vault on disk. |

---

### Why I Built It

I love Obsidian because my notes are plain files that I fully own.

Vault Desk started as an experiment to create a different way of interacting with those files without giving up the simplicity, portability, and privacy of a local Markdown vault.
