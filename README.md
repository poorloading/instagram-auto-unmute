# Instagram Auto Unmute Reels

[![license](https://img.shields.io/github/license/poorloading/instagram-auto-unmute)](LICENSE)
[![last commit](https://img.shields.io/github/last-commit/poorloading/instagram-auto-unmute)](https://github.com/poorloading/instagram-auto-unmute/commits/main)
[![Tampermonkey](https://img.shields.io/badge/userscript-Tampermonkey-orange)](Auto-Unmute-Instagram.user.js)

A Tampermonkey userscript that unmutes Instagram Reels as you scroll. Instagram
mutes Reels by default and forgets your choice constantly; this script keeps the
reel that's actually on your screen unmuted, and keeps every other video silent.

No overlapping audio, and no restarting a video you're already halfway through.

> **Also available for Facebook:** [facebook-auto-unmute](https://github.com/poorloading/facebook-auto-unmute)

---

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Privacy](#privacy)
- [Testing](#testing)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔊 **Sound on, automatically.** Clicks Instagram's own unmute button *and* sets
  `video.muted = false` directly, so it works even when the button isn't
  rendered.
- 🎯 **One reel at a time.** Only the reel at least 60% on screen is unmuted;
  every other `<video>` in the DOM, preloaded or off-screen, is force-muted. No
  two reels talking over each other.
- 🔄 **Doesn't restart what you're watching.** A reel you're halfway through
  keeps playing. Rewinding happens once per video, never mid-playback, and a
  reused element still restarts when Instagram moves on to the next reel.
- 🧩 **Leaves the page alone.** It reads and toggles a `muted` attribute, nothing
  more — no injected UI, no changes to Instagram's own elements.
- 🌍 **Works in your language.** Unmute button labels are configurable, so a
  non-English UI can be supported.

## Installation

### Option A — one-click (recommended)

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/)
   or [Violentmonkey](https://violentmonkey.github.io/).
2. Open the raw script and your manager will offer to install it:
   **[Install Auto-Unmute-Instagram.user.js](https://raw.githubusercontent.com/poorloading/instagram-auto-unmute/main/Auto-Unmute-Instagram.user.js)**
3. Confirm the install, then open [instagram.com](https://www.instagram.com) — it
   runs automatically.

Because the script declares `@updateURL` / `@downloadURL`, your manager will
check this repository for updates on its own.

### Option B — manual

1. Install [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. Open the extension → **Dashboard** → **+** (create a new script).
3. Replace the template with the contents of
   [`Auto-Unmute-Instagram.user.js`](Auto-Unmute-Instagram.user.js).
4. Save (`Ctrl`/`Cmd` + `S`) and reload Instagram.

> **Note:** manual installs are not auto-updated unless you keep the
> `@updateURL` header intact.

## Requirements

- A Chromium-based browser (Chrome, Edge, Brave, Opera) or Firefox
- [Tampermonkey](https://www.tampermonkey.net/) v4.0+ or
  [Violentmonkey](https://violentmonkey.github.io/) v2.12+
- Runs on `https://*.instagram.com/*`; no special `@grant` permissions are
  requested

`Element.checkVisibility()` is used where available (Chrome 105+, Firefox 113+,
Safari 16.4+); older browsers fall back to a box-size check.

## Usage

Once installed it runs automatically — there's nothing to click.

If you want to watch it work, set `DEBUG = true` at the top of the script and
open DevTools → Console. It's off by default; every action is logged when
enabled.

## Configuration

Edit these constants near the top of the script:

| Constant | Default | Description |
| --- | --- | --- |
| `DEBUG` | `false` | Set to `true` for verbose per-action console logging. |
| `VISIBILITY_THRESHOLD` | `0.6` | Fraction of a reel's area that must be on screen for it to count as "active". Lower it if reels stay muted on small windows. |
| `APPLY_DELAY_MS` | `120` | Debounce window that coalesces bursts of observer callbacks. |
| `RESCAN_MS` | `5000` | Safety-net rescan interval. Raise it to reduce CPU usage. |
| `UNMUTE_LABELS` | `['Unmute']` | `aria-label` values treated as the unmute button. Add your UI language's label if the button never gets clicked. |

**Don't want the auto-rewind?** Delete (or comment out) the `video.currentTime =
0;` block inside `applyMuteState()`. Unmuting will still work; reels just won't
snap back to the start.

## How it works

An `IntersectionObserver` watches every reel, alongside a `MutationObserver` for
newly added players and a safety-net rescan. Each `applyMuteState()` run:

1. **Clicks visible unmute buttons** — queries every selector in `UNMUTE_LABELS`
   and only acts on elements that are actually visible
   (`Element.checkVisibility()`, with an area-ratio fallback).
2. **Picks the single active video** — takes the reel with the highest on-screen
   fraction the observer has reported, provided it clears
   `VISIBILITY_THRESHOLD`.
3. **Unmutes the active video, mutes the rest** — preloaded and off-screen reels
   are explicitly muted so they can't play audio in parallel.
4. **Resets once per source** — `currentTime` is rewound to `0` only when the
   element's `currentSrc` differs from the one it was last rewound on, so a
   reused element restarts on the next reel without interrupting playback
   mid-video.
5. **Keeps no tracking garbage** — the `WeakMap` entry is collected along with
   the element, so there is nothing to prune.

Under the hood, in case you're auditing it:

- No reel is ever measured with `getBoundingClientRect()`; the observer supplies
  the ratio, so there's no repeated forced layout during long scrolling
  sessions.
- Rewind state lives in a `WeakMap` keyed on each `<video>`, garbage-collected
  with the element. No `dataset` stamping, no `Set` to prune, no DOM mutation.
- Nothing is muted or unmuted until the observer has reported at least one
  ratio, so the script never acts on a guess at startup.
- Everything is behind a `DEBUG` flag, so the console stays quiet unless you ask
  for it.
- The script makes no network requests of its own.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Nothing happens | Confirm the script is enabled in your manager's dashboard and the page is `instagram.com`, then hard-reload (`Ctrl`/`Cmd` + `Shift` + `R`). |
| Reels stay muted | Your browser may block autoplay with sound until you interact with the page — click once anywhere on Instagram. Also try lowering `VISIBILITY_THRESHOLD`. |
| Audio from two reels at once | Shouldn't happen; make sure you're not also running an older copy of this script. |
| Videos keep restarting | Make sure you're on v3.0.0 or later. Open an issue with your version if it persists. |
| The unmute button never gets clicked | `aria-label="Unmute"` is the English label and Instagram localizes it. Add yours to `UNMUTE_LABELS` — the direct `muted = false` path still works without it. |
| Want to see what it's doing | Set `DEBUG = true` and open DevTools → Console. |

## Known limitations

- **Desktop web only.** Mobile apps can't run userscripts.
- **One reel at a time.** A reel that is mostly off-screen won't be unmuted, by
  design. Lower `VISIBILITY_THRESHOLD` if that's too strict for your window size.
- **Autoplay policies still apply.** Chrome and Firefox may require one
  interaction with the page per session before sound is allowed at all. The
  script can't override that.
- **Instagram's markup changes.** Button labels are localized and renamed
  occasionally. When that happens, add the new label to `UNMUTE_LABELS`.

## Privacy

The script runs entirely in your browser. It reads and modifies Instagram's page
elements locally and makes **no network requests** of its own.

## Testing

The core logic runs headlessly against a stubbed DOM, so no browser is needed:

```
node test/unmute.test.js
```

It covers active-reel selection, force-muting the non-active reels,
rewind-once-per-source, and asserts that no video is ever measured for layout.
No dependencies — just Node.

## Changelog

### v3.0.0
- Replaced the 1.2 s poll with an `IntersectionObserver`. The browser reports each reel's on-screen fraction when it crosses a threshold, so the script no longer calls `getBoundingClientRect()` on any player — the repeated forced layout during long scrolling sessions is gone.
- The poll survives only as a `RESCAN_MS` (5 s) safety net for state changes that touch no DOM, such as a reel re-muting itself.
- New reels are handed to the observer from the `MutationObserver`, and `RATIO_THRESHOLDS` includes `VISIBILITY_THRESHOLD` so a callback fires exactly at the decision boundary.
- Nothing is unmuted or muted until the observer has reported a ratio, so the script no longer acts on a guess at startup.
- `POLL_INTERVAL_MS` is gone, replaced by `APPLY_DELAY_MS` and `RESCAN_MS`.

### v2.2.0
- Fixed the rewind-once logic going stale: `dataset.unmuterId` was stamped once from `video.src` and never updated, so an element Instagram reused for the next reel still looked "already reset" and was never rewound. Tracking is now a `WeakMap` keyed on the element's `currentSrc`.
- Switched the source check to `currentSrc` rather than `src`, which is empty for elements that load media through `<source>` children.
- Dropped the `Set`-pruning pass; a `WeakMap` is collected with the element, so there is nothing to prune.
- Unmute buttons are now checked with `Element.checkVisibility()` (area-ratio fallback) instead of a non-zero-area test, so a button 1px on screen is no longer clicked.
- Added `UNMUTE_LABELS`, so a non-English UI label can be supported.
- Wrapped the `currentTime = 0` seek in `try/catch`.
- Dropped the redundant `https://www.instagram.com/*` `@match`; `https://*.instagram.com/*` already covers it.

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

Pull requests are welcome. For major changes, please open an issue first to
discuss what you'd like to change. When reporting a bug, include your browser,
userscript manager, script version, and any `DEBUG = true` console output.

## License

[MIT](LICENSE) © poorloading
