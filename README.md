# conao3-sa

Local git diff & repo reviewer. Browse a working tree, walk the commit
graph, and review diffs (file-tree, viewed state, inline comments,
vim-flavoured keybindings) — all from your own machine, no upload.

Crate name: `conao3-sa`. Executable: `sa`.

## Status

Early development. The codebase is intentionally small and the API
surfaces are not stable.

## Install & run

`conao3-sa` is published on crates.io
([crates.io/crates/conao3-sa](https://crates.io/crates/conao3-sa)).

### Prerequisites

- Rust toolchain (1.95+) — install via [rustup](https://rustup.rs/) or
  the Nix devShell (`nix develop`).
- A `git` binary on `PATH` (the backend shells out to it).
- For the Tauri shell on Linux: `webkit2gtk-4.1`, `libsoup-3`,
  `gtk3` (see the Tauri docs for your distro).

### Option A — install from crates.io

```bash
cargo install conao3-sa
```

This drops two executables into `~/.cargo/bin`:

| Binary  | What it does                                                                  |
| ------- | ----------------------------------------------------------------------------- |
| `sa`    | Tauri desktop shell — spawns the axum backend in-process and opens a WebView. |
| `serve` | Headless axum backend at `127.0.0.1:4000` (GraphQL + REST + SSE).             |

⚠️ The published crate ships only the Rust sources; the **frontend
SPA bundle is not yet attached to the published binary**. Without the
bundle the WebView will fail to load the UI. Use Option B below for an
end-to-end install. `serve` alone is useful if you only need the
backend (e.g. to drive your own client).

### Option B — install from source (with frontend bundled)

```bash
git clone https://github.com/conao3/rust-sa
cd rust-sa

# toolchain (Nix devShell provides node, pnpm, cargo-tauri, cargo-watch).
direnv allow   # or: nix develop

# Either run `cargo tauri build` (this builds the SPA via the
# beforeBuildCommand hook, then a release binary that includes it):
cd src-tauri
cargo tauri build --no-bundle      # → target/release/sa
# (or `cargo tauri build` to also produce platform packages .deb/.AppImage/etc.)

# …or `cargo install` after building the SPA yourself:
cd ..
make -C frontend build
cargo install --path src-tauri --bin sa
```

### Launching

```bash
# Desktop UI (Tauri WebView). The shell starts the backend on
# 127.0.0.1:4000 in a side thread and then opens the WebView at the
# bundled SPA.
sa

# Or headless backend + browser (handy for development):
serve &
# then run the frontend dev server in another shell:
#   make -C frontend dev   # vite via portless at https://sa.localhost
```

The first time you launch, you'll be on `/` — point it at any local
repo via the folder picker and you'll land in `/browse`. From there
`graph` / `diff` are linked in the top bar.

### Preferences

Theme is persisted to `~/.config/sa/config.toml`. Everything else
(layout, density, pane widths, recents, comments, viewed state) lives
in browser `localStorage`.


## Stack

- **Backend** (`src-tauri/`) — Rust, axum, async-graphql, Tauri 2.
  Shells out to `git` for diff / log / show / ls-tree / for-each-ref;
  serves GraphQL at `/api/graphql` and SSE at `/api/events`.
  Per-repo file watcher via notify-debouncer-mini, filtered through the
  `ignore` crate so nested `.gitignore` and global excludes are honored.
  Preferences persist to `~/.config/sa/config.toml`.
- **Frontend** (`frontend/`) — TanStack Start (React 19) on Vite +
  Rolldown. React Compiler, TanStack Router / Form / Hotkeys, Apollo
  Client 4, react-aria-components, Tailwind v4. Diff rendering via
  `@pierre/diffs`, file tree via `@pierre/trees`, syntax highlighting
  via Shiki.
- **Tooling** — oxlint, oxfmt, knip, tsc (via `make lint`); cargo-watch
  for backend auto-reload; treefmt + nixfmt / rustfmt / prettier; flake
  devShell.

## Layout

```
src-tauri/      Rust backend (axum + GraphQL + git CLI)
  src/main.rs        Tauri shell (executable: sa)
  src/bin/serve.rs   axum binary for dev (cargo run --bin serve)
frontend/       TanStack Start frontend
  src/routes/   __root, /, /browse, /compare/$, /graph, /preference, /design, /health
  src/components, src/lib
Makefile        Orchestrates src-tauri + frontend
flake.nix       Nix devShell (rust, node, pnpm, cargo-tauri, cargo-watch)
```

## Routes

- `/` — landing. Repo input + folder picker (fuzzy filter; click the
  `GIT` badge on any row to open it directly); recents list with
  per-row trash.
- `/browse?repo=<abs>&path=<rel>&rev=<ref>` — repo browser. Closed
  tree on first paint; clicking a file fetches its content from
  `/api/blob` and renders it with Shiki. Blob & highlight are cached
  by URL/path so revisits are instant. `rev` defaults to `HEAD`.
- `/compare/$spec?repo=<abs>&w=1` — diff reviewer. `spec` accepts any
  git rev (`HEAD`, `main`, `v1.0`, `feature/foo`), a two-dot range
  (`main..feature`), or three-dot (`HEAD~3...HEAD`). The pseudos
  `working` and `staging` resolve to `git diff HEAD` and
  `git diff --cached HEAD`, and can also participate in ranges
  (`<commit>..working`, `<commit>..staging`, `staging..working`, …).
  Merge commits show first-parent diff. `?w=1` adds `-w` to ignore
  whitespace. Toggle layout (unified/split) and whitespace from the
  gear menu in the top bar.
- `/graph?repo=<abs>` — commit log + range picker.
  - Sticky `COMMITS` header, infinite scroll for older history.
  - `WORKING` / `STAGING` pseudo-rows pinned at the top, branches and
    tags as collapsible sections (with a fuzzy filter when there are
    more than a handful).
  - **click** sets base, **Ctrl/Cmd + click** sets head,
    **drag across rows** picks `base..head` in one gesture (with the
    intermediate commits tinted), **double-click** opens that commit's
    diff in `/compare`.
- `/preference` — settings. Theme (light/dark) is persisted to
  `~/.config/sa/config.toml`; display options (layout, density,
  pane widths) live in localStorage.
- `/design` — design tokens & palette reference.

## Backend API

```
POST /api/graphql      health, preferences, listDir, commits(limit, skip, repo),
                       files(rev, repo, w), branches(repo), tags(repo),
                       tree(repo, rev), setPreferences(theme)
GET  /api/diff         ?rev=&path=&repo=[&w=1]   text/x-diff, gzip
GET  /api/blob         ?rev=&path=&repo=         text/plain, gzip
GET  /api/events       ?repo=                     SSE; per-repo, gitignore-aware
```

`?repo=<absolute-path>` is required on every URL that touches a
repository. There is no implicit default.

## Development

For working on rust-sa itself (auto-rebuild backend, vite HMR for
frontend). Requires Nix with flakes (provides rust, node 24, pnpm 10,
cargo-tauri, cargo-watch). Otherwise install those tools manually.

```bash
# enter devShell
direnv allow   # or: nix develop

# install frontend deps
cd frontend && pnpm install

# run backend (axum at :4000, auto-restart on .rs edits)
make -C src-tauri dev

# run frontend (vite dev via portless proxy at https://sa.localhost)
make -C frontend dev
```

`devo run` wires both processes as a tmux session named `rust-sa`.

## Lint / format

```bash
make lint     # cargo check + cargo clippy + tsc + oxlint + oxfmt --check + knip
make fmt      # treefmt (rustfmt + prettier + nixfmt) + oxfmt --write
```

## Notable design choices

- `/browse` caches blob fetches **and** Shiki highlight output by URL
  and `(path, theme, content prefix)`, so flipping between files is
  instant after the first visit. The `loading…` indicator is deferred
  200 ms — cache hits never get to show it, only cold fetches do.
- `ignore` crate is used in the watcher so SSE only fires for paths the
  target repo actually cares about (nested `.gitignore`, `info/exclude`,
  global excludes via `core.excludesFile`). Directory-level notify
  events are skipped to suppress spurious refreshes when generated
  files inside ignored directories churn.
- Watcher events are debounced (3 s) and the frontend additionally
  debounces SSE (1.5 s) plus compares the file-list signature before
  flipping any `live` UI, so background dev servers (e.g. Next.js
  rebuilding `.next/`) never flicker the diff view.
- React Compiler handles memoisation; `useMemo` / `useCallback` are
  avoided in application code.
- Comments live in `localStorage`, keyed by rev; the model carries
  `startLineNumber` / `endLineNumber` so multi-line ranges round-trip.
- Theme is the only preference that goes to disk (`config.toml`); all
  ephemeral display state (mode, density, pane widths, section
  open/closed) stays in localStorage to avoid filesystem chatter.

## License

MIT
