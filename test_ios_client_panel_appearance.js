/**
 * Test Suite: iOS iPhone Safari Client Panel & Document Preview Full-Height & Scrolling Resilience
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Testing iOS Safari Client Panel & Document Preview Appearance & Resilience...');

const indexPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. Modals exist
assert(indexHtml.includes('id="modal-window-client"'), 'modal-window-client must exist');
assert(indexHtml.includes('id="modal-document-preview"'), 'modal-document-preview must exist');

// 2. CSS rules: height: 88dvh on desktop for client and document-preview
assert(indexHtml.includes('#modal-document-preview[open]'), 'Desktop modal-document-preview must be in CSS open rules');
assert(indexHtml.includes('height: 88dvh !important;'), 'Desktop rules must specify height: 88dvh !important');
assert(indexHtml.includes('height: 90dvh !important;'), 'Mobile media query must specify height: 90dvh !important');

// 3. Child scroll containers have flex: 1 1 auto
assert(indexHtml.includes('id="client-scroll-container"'), 'client-scroll-container must exist');
assert(indexHtml.includes('id="document-preview-container"'), 'document-preview-container must exist');
assert(indexHtml.includes('document-preview-container'), 'document-preview-container must exist in index.html');
assert(indexHtml.includes('overflow-y-auto flex-1 bg-slate-100/70 w-full overscroll-contain" style="flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch;"'), 'document-preview scroll body must prevent WebKit collapse');

// 4. Admin body also has flex: 1 1 auto
assert(indexHtml.includes('overflow-y-auto flex-1 min-h-0 space-y-6" style="flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch;"'), 'Admin body must have flex: 1 1 auto and iOS momentum scrolling');

// 5. No regression on height: 92vh
assert(!/(?<!max-)height:s*92vh/.test(indexHtml), 'Must not force height: 92vh on desktop');

console.log('✅ ALL iOS Client Panel & Document Preview Tests Passed 100%!');
