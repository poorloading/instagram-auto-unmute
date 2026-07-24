# Instagram Auto Unmute Reels

A Tampermonkey userscript that automatically unmutes Instagram Reels as they play — without constantly resetting videos you've already watched.

## Features

- 🔊 **Auto-unmutes** Reels by clicking Instagram's unmute button and directly setting `video.muted = false`
- 🔄 **One-time reset** — rewinds each video to the start only once using a `Set`, so mid-video playback is never interrupted
- 🧹 **Automatic memory cleanup** — stale video IDs are pruned from the tracking Set when videos leave the DOM
- 🎯 **Reliable visibility check** — uses `getBoundingClientRect()` instead of `offsetParent` to correctly handle `position: fixed` elements
- ⚡ **Lightweight polling** — runs every 1.2 seconds with an initial trigger at 1 second after page load

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open Tampermonkey → Dashboard → click the **+** tab to create a new script
3. Paste in the contents of [`instagram-auto-unmute.user.js`](instagram-auto-unmute.user.js)
4. Save and navigate to [Instagram](https://www.instagram.com) — it works automatically

## Requirements

- A Chromium-based or Firefox browser
- [Tampermonkey](https://www.tampermonkey.net/) v4.0 or later

## How It Works

The script runs on a 1.2-second interval and on each tick:

1. **Clicks any visible unmute button** — queries `div`, `button`, and generic `[aria-label="Unmute"]` elements, only acting on visible ones via `getBoundingClientRect()`
2. **Stamps each video with a stable ID** — uses `dataset.unmuterId` (set to `video.src` or a unique fallback) so IDs don't shift when the DOM changes
3. **Unmutes and resets once per video** — sets `muted = false` every poll, but only rewinds `currentTime` to `0` the first time a video is seen
4. **Prunes the tracking Set** — after each poll, removes IDs for videos no longer present in the DOM to prevent memory leaks

## Changelog

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
