// ==UserScript==
// @name         Instagram Auto Unmute Reels
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto unmutes Instagram Reels without constantly resetting
// @author       Grok
// @match        https://www.instagram.com/*
// @match        https://*.instagram.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log('🚀 Instagram Auto Unmute v1.1 started');

    const resetDone = new Set(); // Track which videos we've already reset

    function unmute() {
        // Unmute buttons
        const buttons = document.querySelectorAll('div[aria-label="Unmute"], button[aria-label="Unmute"], [aria-label="Unmute"]');
        
        buttons.forEach(btn => {
            if (btn.offsetParent !== null) {
                btn.click();
                console.log('✅ Unmute button clicked');
            }
        });

        // Handle videos - reset only once
        document.querySelectorAll('video').forEach((video, index) => {
            const videoId = video.src || index;
            
            if (video.muted) {
                video.muted = false;
                console.log('✅ Video unmuted');
            }

            if (!resetDone.has(videoId)) {
                video.currentTime = 0;
                resetDone.add(videoId);
                console.log('✅ Video reset to start (once)');
            }
        });
    }

    // Run less frequently
    setInterval(unmute, 1200);

    // One-time initial run
    setTimeout(unmute, 1000);

    console.log('✅ Fixed Instagram script ready');
})();
