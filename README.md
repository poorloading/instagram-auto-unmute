# Instagram Auto Unmute Reels

[![Userscript](https://img.shields.io/badge/userscript-v2.1.0-brightgreen)](Auto-Unmute-Instagram.user.js)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A userscript that automatically unmutes Instagram Reels as you scroll — without overlapping audio and without restarting videos you're already watching.

Instagram mutes Reels by default and forgets your choice constantly. This script keeps the reel that's actually on your screen unmuted, and keeps every other video silent.

---

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔊 **Auto-unmute** — clicks Instagram's own unmute button *and* sets `video.muted = false` directly, so it works even when the button isn't rendered.
- 🎯 **One active video at a time** — only the reel that is at least 60% on-screen is unmuted; every other `<video>` in the DOM (preloaded or off-screen reels) is force-muted, so audio never overlaps.
- 🔄 **Rewinds only once** — each video is reset to `currentTime = 0` a single time, tracked in a `Set`, so mid-video playback is never interrupted.
- 📐 **Accurate visibility check** — uses `getBoundingClientRect()` to compute the on-screen *area ratio*, instead of a naive non-zero width/height test, so partially scrolled reels aren't mistaken for the active one.
- ⚡ **Reactive + polled** — a debounced `MutationObserver` reacts to DOM changes (like scrolling to the next reel) in ~150 ms, backed by a 1.2 s interval as a safety net.
- 🧹 **No memory growth** — stale video IDs are pruned from the tracking `Set` once their videos leave the DOM, which matters during long scrolling sessions.
- 🔇 **Quiet console** — per-run logging is gated behind a `DEBUG` flag (off by default); only two startup lines are printed.

## Installation

### Option A — one-click (recommended)

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open the raw script and your manager will offer to install it:
   **[Install Auto-Unmute-Instagram.user.js](https://raw.githubusercontent.com/poorloading/instagram-auto-unmute/main/Auto-Unmute-Instagram.user.js)**
3. Confirm the install, then open [instagram.com](https://www.instagram.com) — it runs automatically.

Because the script declares `@updateURL` / `@downloadURL`, your manager will check this repository for updates on its own.

### Option B — manual

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open the extension → **Dashboard** → **+** (create a new script).
3. Replace the template with the contents of [`Auto-Unmute-Instagram.user.js`](Auto-Unmute-Instagram.user.js).
4. Save (`Ctrl`/`Cmd` + `S`) and reload Instagram.

> **Note:** manual installs are not auto-updated unless you keep the `@updateURL` header intact.

## Requirements

- A Chromium-based browser (Chrome, Edge, Brave, Opera) or Firefox
- [Tampermonkey](https://www.tampermonkey.net/) v4.0+ or [Violentmonkey](https://violentmonkey.github.io/) v2.12+
- Runs on `https://www.instagram.com/*` and `https://*.instagram.com/*`; no special `@grant` permissions are requested

## Configuration

Edit these constants near the top of the script:

| Constant | Default | Description |
| --- | --- | --- |
| `DEBUG` | `false` | Set to `true` for verbose per-action console logging. |
| `VISIBILITY_THRESHOLD` | `0.6` | Fraction of a video's area that must be on-screen for it to count as "active". Lower it if reels stay muted on small windows. |
| `POLL_INTERVAL_MS` | `1200` | Fallback polling interval in milliseconds. Raise it to reduce CPU usage. |

## How it works

The script runs on a debounced `MutationObserver` (~150 ms) plus a 1.2 s polling fallback, with a first pass 1 s after load. Each run:

1. **Clicks visible unmute buttons** — queries `[aria-label="Unmute"]` and only acts on elements with a non-zero visible area.
2. **Stamps each video with a stable ID** — `dataset.unmuterId`, derived from `video.src` (or a unique fallback), so IDs survive DOM reshuffles.
3. **Picks the single active video** — scores every `<video>` by on-screen area ratio and takes the highest, provided it clears `VISIBILITY_THRESHOLD`.
4. **Unmutes the active video, mutes the rest** — preloaded and off-screen reels are explicitly muted so they can't play audio in parallel.
5. **Resets once per video** — `currentTime` is rewound to `0` only the first time a video becomes active.
6. **Prunes the tracking set** — IDs for videos no longer in the DOM are dropped to prevent unbounded growth.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Nothing happens | Confirm the script is enabled in your manager's dashboard and that the page is `instagram.com`, then hard-reload (`Ctrl`/`Cmd` + `Shift` + `R`). |
| Reels stay muted | Your browser may block autoplay with sound until you interact with the page — click once anywhere on Instagram. Also try lowering `VISIBILITY_THRESHOLD`. |
| Audio from two reels at once | Should not happen on v2.1.0+; make sure you're not also running an older copy of this script. |
| Videos keep restarting | Ensure you're on v1.1 or later (the `resetDone` set). Open an issue with your version if it persists. |
| Want to see what it's doing | Set `DEBUG = true` and open DevTools → Console. |

## Known limitations

- Instagram changes its DOM and `aria-label` values often; if the unmute button selector breaks, the direct `video.muted = false` path still works.
- Browser autoplay policies can require one user interaction per session before sound is allowed.
- Only the desktop web app is targeted; mobile apps can't run userscripts.

## Changelog

### v2.1.0
- Fixed a bug where every video on the page (including preloaded/off-screen reels) could be unmuted at once, causing overlapping audio
- Added visible-area-ratio "active video" detection instead of a non-zero width/height check
- Non-active videos are now explicitly force-muted
- Added a `MutationObserver` so the script reacts to scrolling/DOM changes almost instantly, alongside the polling fallback
- Moved per-action console logging behind a `DEBUG` flag (off by default)
- Added `@updateURL` / `@downloadURL` for automatic update checks

### v2.0
- Replaced the `offsetParent` visibility check with `getBoundingClientRect()` for accuracy with `position: fixed` elements
- Added stable `dataset.unmuterId` stamping, fixing unreliable index-based IDs when the DOM shifts
- Added DOM pruning to clear stale IDs from the tracking set during long sessions

### v1.1
- Added a `resetDone` set to track already-reset videos, preventing repeated playback interruptions
- Reduced the poll interval to 1.2 s for a lighter footprint
- Broadened unmute button selectors to cover `div`, `button`, and generic attribute variants

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change. When reporting a bug, include your browser, userscript manager, script version, and any `DEBUG = true` console output.

## License

[MIT](LICENSE) © poorloading
