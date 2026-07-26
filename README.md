# Instagram Auto Unmute Reels

A Tampermonkey userscript that automatically unmutes Instagram Reels as they play — without constantly resetting videos you've already watched.

## Features

- 🔊 **Auto-unmutes** Reels by clicking Instagram's unmute button and directly setting `video.muted = false`
- 🎯 **Single active video only** — only the reel that is actually on-screen (≥60% visible) gets unmuted; every other `<video>` in the DOM (preloaded/off-screen reels) is force-muted so audio never overlaps
- 🔄 **One-time reset** — rewinds the active video to the start only once using a `Set`, so mid-video playback is never interrupted
- 🧹 **Automatic memory cleanup** — stale video IDs are pruned from the tracking Set when videos leave the DOM
- 📐 **Accurate visibility check** — computes the on-screen area ratio via `getBoundingClientRect()` instead of a simple non-zero width/height check, so partially scrolled reels aren't mistaken for the active one
- ⚡ **Reactive + polling** — a `MutationObserver` reacts to DOM changes (e.g. scrolling to a new reel) within ~150ms, with a 1.2s interval as a safety-net fallback
- 🔇 **Quiet by default** — verbose console logging is behind a `DEBUG` flag (off by default) to avoid console spam during long sessions

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey → Dashboard → click the **+** tab to create a new script
3. Paste in the contents of [`Auto-Unmute-Instagram.user.js`](Auto-Unmute-Instagram.user.js)
4. Save and navigate to [Instagram](https://www.instagram.com) — it works automatically

## Requirements

- A Chromium-based or Firefox browser
- [Tampermonkey](https://www.tampermonkey.net/) v4.0 or later

## How It Works

The script runs on a `MutationObserver` (debounced ~150ms) plus a 1.2-second polling fallback. On each run:

1. **Clicks any visible unmute button** — queries `[aria-label="Unmute"]`, only acting on elements with a non-zero visible area
2. **Stamps each video with a stable ID** — uses `dataset.unmuterId` (set to `video.src` or a unique fallback) so IDs don't shift when the DOM changes
3. **Determines the single "active" video** — computes each video's on-screen visible-area ratio and picks the one most in view (must be ≥60% visible)
4. **Unmutes only the active video** — sets `muted = false` on it, and force-mutes every other video so preloaded/off-screen reels can't play audio simultaneously
5. **Resets once per video** — only rewinds `currentTime` to `0` the first time a video becomes active
6. **Prunes the tracking Set** — after each run, removes IDs for videos no longer present in the DOM to prevent memory leaks

## Changelog

**v2.1.0**
- Fixed a bug where all videos on the page (including preloaded/off-screen reels) could be unmuted at once, causing overlapping audio
- Added visible-area-ratio based "active video" detection instead of a simple non-zero width/height check
- Non-active videos are now explicitly force-muted
- Added a `MutationObserver` so the script reacts to scrolling/DOM changes almost instantly, in addition to the polling fallback
- Console logging moved behind a `DEBUG` flag (off by default)
- Added `@updateURL` / `@downloadURL` so Tampermonkey can auto-check for updates

**v2.0**
- Replaced `offsetParent` visibility check with `getBoundingClientRect()` for accuracy with `position: fixed` elements
- Added stable `dataset.unmuterId` stamping — fixes unreliable index-based video IDs when the DOM shifts
- Added DOM pruning to clean up stale IDs from the tracking Set on long sessions

**v1.1**
- Added `resetDone` Set to track already-reset videos, preventing repeated playback interruptions
- Reduced poll interval to 1.2s for a lighter footprint
- Broadened unmute button selectors to cover `div`, `button`, and generic attribute variants

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
