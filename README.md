# Instagram Auto Unmute

A Tampermonkey userscript that automatically unmutes Instagram Reels as they play, so you never have to tap the mute button again.

## Features

- 🔊 **Auto-unmutes** Instagram Reels the moment they become active
- 🔄 **Auto-resets** Reels for clean playback when revisiting
- ⏱️ **Timing-aware** — accounts for Instagram's dynamic content loading
- 🎯 **Precise targeting** — reliably finds the correct video element in Instagram's player structure

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click **[Install Script](#)** *(or open Tampermonkey → Dashboard → New Script and paste the source)*
3. Navigate to [Instagram](https://www.instagram.com) and browse Reels — it works automatically

## Requirements

- A Chromium-based or Firefox browser
- [Tampermonkey](https://www.tampermonkey.net/) v4.0 or later

## How It Works

The script uses a `MutationObserver` to watch for Reels becoming active in the feed. When one is detected:

1. A short delay allows Instagram's player to fully initialize
2. The correct `<video>` element is located within the Reel container
3. `muted` is set to `false` and playback is reset as needed

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
