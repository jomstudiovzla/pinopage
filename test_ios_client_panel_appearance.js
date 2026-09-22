/**
 * Test Suite: iOS iPhone Safari Client Panel Full-Height & Scrolling Resilience
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing iOS Safari Client Panel Appearance & Resilience...');

const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. #modal-window-client exists and has proper dialog structure
assert(indexHtml.includes('id="modal-window-client"'), 'modal-window-client must exist');

// 2. CSS rules: height: 88dvh on desktop, height: 90dvh on mobile
assert(indexHtml.includes('height: 88dvh !important;'), 'Desktop modal-window-client must have height: 88dvh !important');
assert(indexHtml.includes('height: 90dvh !important;'), 'Mobile media query must specify height: 90dvh !important');

// 3. Child scroll container has flex: 1 1 auto to prevent WebKit flex basis 0% collapse
assert(indexHtml.includes('id="client-scroll-container"'), 'client-scroll-container must exist');
assert(indexHtml.includes('flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch;'), 'client-scroll-container must prevent WebKit collapse');

// 4. Admin body also has flex: 1 1 auto
assert(indexHtml.includes('overflow-y-auto flex-1 min-h-0 space-y-6" style="flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch;"'), 'Admin body must have flex: 1 1 auto and iOS momentum scrolling');

// 5. No regression on height: 92vh
assert(!/(?<!max-)height:s*92vh/.test(indexHtml), 'Must not force height: 92vh on desktop');

console.log('✅ ALL iOS Client Panel Tests Passed 100%!');
