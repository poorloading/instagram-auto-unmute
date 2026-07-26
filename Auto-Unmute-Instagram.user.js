// ==UserScript==
// @name         Instagram Auto Unmute Reels
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Auto unmutes Instagram Reels without constantly resetting
// @author       Grok
// @match        https://www.instagram.com/*
// @match        https://*.instagram.com/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/poorloading/instagram-auto-unmute/main/Auto-Unmute-Instagram.user.js
// @downloadURL  https://raw.githubusercontent.com/poorloading/instagram-auto-unmute/main/Auto-Unmute-Instagram.user.js
// ==/UserScript==
(function () {
    'use strict';

    const DEBUG = false; // flip to true for verbose console logging
    const VISIBILITY_THRESHOLD = 0.6; // fraction of a video's area that must be on-screen to count as "active"
    const POLL_INTERVAL_MS = 1200;

    const log = (...args) => DEBUG && console.log(...args);

    console.log('🚀 Instagram Auto Unmute v2.1 started');

    const resetDone = new Set();

    // Fraction (0-1) of the element that is currently within the viewport.
    function visibleRatio(el) {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return 0;

        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;

        const visibleWidth = Math.min(rect.right, vw) - Math.max(rect.left, 0);
        const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        if (visibleWidth <= 0 || visibleHeight <= 0) return 0;

        const totalArea = rect.width * rect.height;
        const visibleArea = visibleWidth * visibleHeight;
        return totalArea > 0 ? visibleArea / totalArea : 0;
    }

    function stampId(video, index) {
        if (!video.dataset.unmuterId) {
            video.dataset.unmuterId = video.src || `video-${index}-${Date.now()}`;
        }
        return video.dataset.unmuterId;
    }

    function clickUnmuteButtons() {
        document.querySelectorAll('[aria-label="Unmute"]').forEach(btn => {
            if (visibleRatio(btn) > 0) {
                btn.click();
                log('✅ Unmute button clicked');
            }
        });
    }

    function unmute() {
        clickUnmuteButtons();

        const videos = Array.from(document.querySelectorAll('video'));
        if (!videos.length) return;

        // Pick the single most-visible video as the "active" reel. Only that
        // video should ever be unmuted / reset — everything else (preloaded
        // or off-screen reels) is explicitly muted so audio never overlaps.
        let activeVideo = null;
        let bestRatio = 0;
        videos.forEach((video, index) => {
            stampId(video, index);
            const ratio = visibleRatio(video);
            if (ratio > bestRatio) {
                bestRatio = ratio;
                activeVideo = video;
            }
        });

        videos.forEach(video => {
            const isActive = video === activeVideo && bestRatio >= VISIBILITY_THRESHOLD;

            if (isActive) {
                if (video.muted) {
                    video.muted = false;
                    log('✅ Active video unmuted');
                }
                const id = video.dataset.unmuterId;
                if (!resetDone.has(id)) {
                    video.currentTime = 0;
                    resetDone.add(id);
                    log('✅ Active video reset to start (once)');
                }
            } else if (!video.muted) {
                // Prevent off-screen/preloaded videos from playing audio in parallel.
                video.muted = true;
                log('🔇 Non-active video muted');
            }
        });

        // Prune stale IDs for videos no longer in the DOM.
        const liveIds = new Set(videos.map(v => v.dataset.unmuterId).filter(Boolean));
        resetDone.forEach(id => {
            if (!liveIds.has(id)) resetDone.delete(id);
        });
    }

    // React quickly to DOM changes (e.g. scrolling to the next reel)...
    let mutationTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(mutationTimer);
        mutationTimer = setTimeout(unmute, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ...and also poll as a safety net in case mutations are missed.
    setInterval(unmute, POLL_INTERVAL_MS);

    // Initial run
    setTimeout(unmute, 1000);

    console.log('✅ Instagram script ready');
})();
