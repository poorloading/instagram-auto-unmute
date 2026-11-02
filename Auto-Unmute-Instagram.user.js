// ==UserScript==
// @name         Instagram Auto Unmute Reels
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Auto unmutes Instagram Reels without constantly resetting
// @author       poorloading
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
    const APPLY_DELAY_MS = 120; // coalesce bursts of observer callbacks
    const RESCAN_MS = 5000; // safety net: find new videos, re-check mute
    const UNMUTE_LABELS = ['Unmute']; // add your UI language's label(s) here

    // The points at which the browser reports that a video's on-screen
    // fraction changed. The decision boundary is included, so we get a
    // callback exactly when a reel crosses it.
    const RATIO_THRESHOLDS = [0, 0.25, 0.5, VISIBILITY_THRESHOLD, 0.75, 1];

    const log = (...args) => DEBUG && console.log(...args);

    console.log('🚀 Instagram Auto Unmute v3.0.0 started');

    // One selector built from every localized label we know about.
    const UNMUTE_SELECTOR = UNMUTE_LABELS.map(label => `[aria-label="${label}"]`).join(', ');

    // element -> the source we last rewound it on. Instagram reuses the same
    // element for the next reel, so the source — not the element — is what
    // identifies "a different video". Keys are collected with the element, so
    // there is no Set to prune.
    const lastResetSrc = new WeakMap();

    // element -> last on-screen fraction the browser reported for it. This
    // replaces measuring getBoundingClientRect() ourselves: the observer hands
    // us the number for free, and only when it actually changes.
    const ratios = new WeakMap();

    // Reels already handed to the observer, so we never observe one twice.
    const observed = new WeakSet();

    let haveRatios = false;

    const io = new IntersectionObserver(entries => {
        for (const entry of entries) {
            ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
            haveRatios = true;
        }
        scheduleApply(APPLY_DELAY_MS);
    }, { threshold: RATIO_THRESHOLDS });

    function observeVideos() {
        for (const video of document.querySelectorAll('video')) {
            if (!observed.has(video)) {
                observed.add(video);
                io.observe(video);
            }
        }
    }

    function isVisible(el) {
        if (typeof el.checkVisibility === 'function') {
            return el.checkVisibility();
        }
        // Fallback for older browsers. Only ever runs on a handful of buttons,
        // never on the video list.
        return el.getBoundingClientRect().width > 0;
    }

    function clickUnmuteButtons() {
        document.querySelectorAll(UNMUTE_SELECTOR).forEach(btn => {
            if (isVisible(btn)) {
                btn.click();
                log('✅ Unmute button clicked');
            }
        });
    }

    function applyMuteState() {
        // Nothing measured yet: touching mute state now would act on a guess.
        if (!haveRatios) return;

        clickUnmuteButtons();

        const videos = Array.from(document.querySelectorAll('video'));
        if (!videos.length) return;

        // Pick the single most-visible video as the "active" reel. Only that
        // video should ever be unmuted / reset — everything else (preloaded
        // or off-screen reels) is explicitly muted so audio never overlaps.
        let activeVideo = null;
        let bestRatio = 0;
        videos.forEach(video => {
            const ratio = ratios.get(video) || 0;
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

                // Rewind once per source, so a reused element still restarts
                // when Instagram swaps in the next reel.
                const src = video.currentSrc || video.src;
                if (lastResetSrc.get(video) !== src) {
                    try {
                        video.currentTime = 0;
                    } catch (err) {
                        log('rewind failed', err);
                    }
                    lastResetSrc.set(video, src);
                    log('✅ Active video reset to start (once)');
                }
            } else if (!video.muted) {
                // Prevent off-screen/preloaded videos from playing audio in parallel.
                video.muted = true;
                log('🔇 Non-active video muted');
            }
        });
    }

    let pendingTimer = null;
    function scheduleApply(delay) {
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(applyMuteState, delay);
    }

    // React to new <video> elements: observe them, then re-run.
    function hasRelevantMutation(records) {
        const selector = `video, ${UNMUTE_SELECTOR}`;
        for (const { addedNodes } of records) {
            for (const node of addedNodes) {
                if (node.nodeType !== 1) continue; // elements only
                if (node.matches(selector)) return true;
                if (node.querySelector(selector)) return true;
            }
        }
        return false;
    }

    if (document.body) {
        new MutationObserver(records => {
            if (!hasRelevantMutation(records)) return;
            observeVideos();
            scheduleApply(APPLY_DELAY_MS);
        }).observe(document.body, { childList: true, subtree: true });
    }

    // Safety net for state that changes without the observer noticing: a reel
    // re-muting itself, or a player swapped in without a DOM insertion we saw.
    // Cheap, because it reads no layout.
    setInterval(() => {
        observeVideos();
        applyMuteState();
    }, RESCAN_MS);

    // Start observing immediately; the observer's first callback drives the
    // first unmute, and the delayed run covers anything it missed.
    observeVideos();
    scheduleApply(1000);

    console.log('✅ Instagram script ready');
})();
