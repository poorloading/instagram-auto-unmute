// ==UserScript==
// @name         Instagram Auto Unmute Reels
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Auto unmutes Instagram Reels without constantly resetting
// @author       Grok
// @match        https://www.instagram.com/*
// @match        https://*.instagram.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function () {
    'use strict';
    console.log('🚀 Instagram Auto Unmute v2.0 started');

    const resetDone = new Set();

    function isVisible(el) {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function stampId(video, index) {
        if (!video.dataset.unmuterId) {
            video.dataset.unmuterId = video.src || `video-${index}-${Date.now()}`;
        }
        return video.dataset.unmuterId;
    }

    function unmute() {
        // Click visible unmute buttons
        document.querySelectorAll('div[aria-label="Unmute"], button[aria-label="Unmute"], [aria-label="Unmute"]')
            .forEach(btn => {
                if (isVisible(btn)) {
                    btn.click();
                    console.log('✅ Unmute button clicked');
                }
            });

        // Unmute videos and reset only once per video
        document.querySelectorAll('video').forEach((video, index) => {
            const id = stampId(video, index);

            if (video.muted) {
                video.muted = false;
                console.log('✅ Video unmuted');
            }

            if (!resetDone.has(id)) {
                video.currentTime = 0;
                resetDone.add(id);
                console.log('✅ Video reset to start (once)');
            }
        });

        // Prune stale IDs for videos no longer in the DOM
        const liveIds = new Set(
            Array.from(document.querySelectorAll('video'))
                .map(v => v.dataset.unmuterId)
                .filter(Boolean)
        );
        resetDone.forEach(id => {
            if (!liveIds.has(id)) resetDone.delete(id);
        });
    }

    // Poll every 1.2s
    setInterval(unmute, 1200);

    // Initial run
    setTimeout(unmute, 1000);

    console.log('✅ Instagram script ready');
})();
