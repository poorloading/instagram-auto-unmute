// ==UserScript==
// @name         Instagram Auto Unmute Reels
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically unmutes Instagram Reels and videos
// @author       Grok
// @match        https://www.instagram.com/*
// @match        https://*.instagram.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    console.log('🚀 Instagram Auto Unmute v1.0 started');

    function unmute() {
        const buttons = document.querySelectorAll('div[aria-label="Unmute"], button[aria-label="Unmute"], [aria-label="Unmute"]');
        
        buttons.forEach(btn => {
            if (btn.offsetParent !== null) {
                btn.click();
                console.log('✅ Unmute button clicked');
            }
        });

        document.querySelectorAll('video').forEach(video => {
            if (video.muted) {
                video.muted = false;
                video.currentTime = 0;
                console.log('✅ Video unmuted and reset');
            }
        });
    }

    setInterval(unmute, 800);
    document.addEventListener('click', () => setTimeout(unmute, 500));

    console.log('✅ Instagram script ready');
})();