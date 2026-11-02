// Headless regression tests for Auto-Unmute-Instagram.user.js.
//
// Runs the userscript against a stubbed DOM, so the core logic can be checked
// without a browser, a userscript manager or any npm dependencies.
//
// Usage: node test/unmute.test.js
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'Auto-Unmute-Instagram.user.js');
const VW = 1000;
const VH = 1000;

// --- stubs -----------------------------------------------------------------

function rect(top, height, width = VW, left = 0) {
    return { top, left, right: left + width, bottom: top + height, width, height };
}

function makeVideo(r, src) {
    return {
        muted: false,
        currentTime: 5,
        currentSrc: src,
        src: src,
        _rect: r,
        getBoundingClientRect() { return this._rect; },
    };
}

// Loads the userscript in a fake page and hands back its `unmute` function,
// captured from the setInterval registration.
function load(videos) {
    let intervalFn = null;

    const document = {
        body: {},
        documentElement: { clientWidth: VW, clientHeight: VH },
        querySelectorAll(selector) {
            return String(selector).trim() === 'video' ? videos : [];
        },
        addEventListener() {},
    };

    const sandbox = {
        document,
        window: { innerWidth: VW, innerHeight: VH },
        MutationObserver: class { observe() {} disconnect() {} },
        console: { log() {} },
        setTimeout: () => 0,
        clearTimeout: () => {},
        setInterval: (fn) => { intervalFn = fn; return 1; },
    };

    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), sandbox, { filename: SCRIPT });

    if (typeof intervalFn !== 'function') {
        throw new Error('setInterval was never called: did the script fail to load?');
    }
    return intervalFn;
}

// --- runner ----------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  pass  ' + name);
    } catch (err) {
        failed++;
        console.log('  FAIL  ' + name);
        console.log('        ' + err.message);
    }
}

function assert(cond, message) {
    if (!cond) throw new Error(message);
}

// --- active video ----------------------------------------------------------

test('unmutes the most on-screen reel', () => {
    const active = makeVideo(rect(0, VH), 'ig-1');
    const behind = makeVideo(rect(2000, VH), 'ig-2');
    load([active, behind])();

    assert(active.muted === false, 'active reel should be unmuted');
});

test('force-mutes offscreen reels so audio does not overlap', () => {
    const active = makeVideo(rect(0, VH), 'ig-1');
    const behind = makeVideo(rect(2000, VH), 'ig-2');
    load([active, behind])();

    assert(behind.muted === true, 'offscreen reel should be muted');
});

test('leaves every reel muted when none clears the threshold', () => {
    // Tall elements straddling the bottom edge: only a sliver of each is shown.
    const a = makeVideo(rect(870, 1000), 'a'); // ~13% on screen
    const b = makeVideo(rect(950, 1000), 'b'); // ~5% on screen
    load([a, b])();

    assert(a.muted === true && b.muted === true, 'no reel qualifies, so none should play audio');
});

// --- rewind ----------------------------------------------------------------

test('rewinds a newly seen reel once', () => {
    const active = makeVideo(rect(0, VH), 'ig-1');
    load([active])();

    assert(active.currentTime === 0, 'expected currentTime to be rewound to 0');
});

test('does not rewind a reel that is already playing', () => {
    const active = makeVideo(rect(0, VH), 'ig-1');
    const run = load([active]);

    run();
    active.currentTime = 7;
    run();

    assert(active.currentTime === 7, 'mid-playback reel must not be interrupted');
});

test('rewinds a reused element again when its source changes', () => {
    // The v2.2.0 regression: Instagram reuses one <video> for the next reel,
    // and the old dataset.unmuterId stamping never noticed the new source.
    const active = makeVideo(rect(0, VH), 'ig-1');
    const run = load([active]);

    run();
    active.currentSrc = 'ig-2';
    active.currentTime = 7;
    run();

    assert(active.currentTime === 0, 'a new source on a reused element should rewind');
});

// --- report ----------------------------------------------------------------

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
