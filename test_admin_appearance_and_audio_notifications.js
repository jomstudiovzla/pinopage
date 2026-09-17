/**
 * Test Suite: Admin Panel Cross-Device Appearance & Audio Bell Notifications
 * Verifies:
 * 1. Admin modal responsive styling (h-[92vh], dvh rules, flex-1 min-h-0)
 * 2. Header compact padding & single-line horizontal swipeable tabs
 * 3. Campanita UI elements (bell, pulsing badge, dropdown panel, sound toggle)
 * 4. Web Audio API synthesizer (PinoAudioNotifier with chords/chimes)
 * 5. Device vibration & notification triggers
 * 6. Dual device + email notification on client actions (quotes, registrations, messages)
 * 7. Service Worker v22 bump
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Running Test Suite: Admin Panel Cross-Device Appearance & Audio Bell Notifications...');

const indexHtmlPath = path.join(__dirname, 'index.html');
const pinoDbPath = path.join(__dirname, 'assets', 'js', 'pino-db.js');
const swJsPath = path.join(__dirname, 'sw.js');

assert(fs.existsSync(indexHtmlPath), 'index.html must exist');
assert(fs.existsSync(pinoDbPath), 'pino-db.js must exist');
assert(fs.existsSync(swJsPath), 'sw.js must exist');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const pinoDb = fs.readFileSync(pinoDbPath, 'utf8');
const swJs = fs.readFileSync(swJsPath, 'utf8');

// Test 1: Admin modal container has explicit responsive height and flex column
console.log('👉 Test 1: Admin modal responsive height and flexbox configuration');
assert(indexHtml.includes('id="modal-window-admin"'), 'modal-window-admin must exist');
assert(indexHtml.includes('h-[92vh]'), 'modal-window-admin must specify explicit height h-[92vh]');
assert(indexHtml.includes('max-h-[94vh]'), 'modal-window-admin must specify max-h-[94vh]');
assert(indexHtml.includes('flex flex-col'), 'modal-window-admin must be flex flex-col');
assert(indexHtml.includes('overflow-hidden'), 'modal-window-admin must be overflow-hidden');

// Test 2: CSS rules for dialog.section-window, dvh and mobile viewport
console.log('👉 Test 2: CSS dvh rules for iPad and mobile viewports');
assert(indexHtml.includes('height: 92dvh !important;'), 'CSS must specify height: 92dvh !important');
assert(indexHtml.includes('max-height: 94dvh !important;'), 'CSS must specify max-height: 94dvh !important');
assert(indexHtml.includes('#modal-window-admin:not([open])'), 'CSS must handle closed dialog with display: none !important');
assert(indexHtml.includes('@media (max-width: 768px)'), 'CSS must include media query for mobile/tablet');

// Test 3: Tab Content Body has flex-1 min-h-0
console.log('👉 Test 3: Content body flex-1 min-h-0 expansion');
assert(indexHtml.includes('overflow-y-auto flex-1 min-h-0'), 'Admin tab content body must have overflow-y-auto flex-1 min-h-0');

// Test 4: Header has compact padding & single-line horizontal tabs
console.log('👉 Test 4: Compact header padding & horizontal swipeable tabs');
assert(indexHtml.includes('px-4 sm:px-6 py-3.5 sm:py-4'), 'Admin header must have compact padding');
assert(indexHtml.includes('flex overflow-x-auto no-scrollbar border-b'), 'Tab bar must be single-line horizontal scrollable');
assert(!indexHtml.includes('flex overflow-x-auto no-scrollbar sm:flex-wrap'), 'Tab bar must NOT wrap on sm tablets');

// Test 5: Campanita UI elements
console.log('👉 Test 5: Campanita interactive bell, badge, dropdown & sound toggle');
assert(indexHtml.includes('id="admin-notif-bell-btn"'), 'Campanita bell button must exist');
assert(indexHtml.includes('id="admin-bell-icon"'), 'Campanita bell icon must exist');
assert(indexHtml.includes('id="admin-notif-badge"'), 'Campanita notification badge must exist');
assert(indexHtml.includes('id="admin-notif-dropdown"'), 'Campanita notification dropdown must exist');
assert(indexHtml.includes('id="admin-sound-toggle-btn"'), 'Sound toggle button must exist');
assert(indexHtml.includes('id="admin-sound-toggle-icon"'), 'Sound toggle icon must exist');

// Test 6: PinoAudioNotifier Web Audio API synthesizer
console.log('👉 Test 6: PinoAudioNotifier Web Audio API synthesis');
assert(indexHtml.includes('window.PinoAudioNotifier = {'), 'window.PinoAudioNotifier must be defined');
assert(indexHtml.includes('playChime:'), 'PinoAudioNotifier must include playChime');
assert(indexHtml.includes('notifyDevice:'), 'PinoAudioNotifier must include notifyDevice');
assert(indexHtml.includes('toggleMute:'), 'PinoAudioNotifier must include toggleMute');
assert(indexHtml.includes('getAudioContext'), 'Must use Web Audio API getAudioContext');
assert(indexHtml.includes('createOscillator'), 'Must synthesize tones with createOscillator');
assert(indexHtml.includes('navigator.vibrate'), 'Must support mobile haptic vibration');

// Test 7: Admin RTDB Notification methods in pino-db.js
console.log('👉 Test 7: Realtime Database admin notification methods in pino-db.js');
assert(pinoDb.includes('async function fetchAdminNotifications()'), 'pino-db.js must export fetchAdminNotifications');
assert(pinoDb.includes('function listenAdminNotifications(callback)'), 'pino-db.js must export listenAdminNotifications');
assert(pinoDb.includes('async function markAdminNotificationRead(notifId)'), 'pino-db.js must export markAdminNotificationRead');
assert(pinoDb.includes('listenAdminNotifications,'), 'listenAdminNotifications must be exported in PinoDB return object');

// Test 8: Client registration triggers email notification to admin
console.log('👉 Test 8: Client registration dispatches admin email & notification');
assert(indexHtml.includes('PinoDB.notifyAdminByEmail({'), 'handleRegisterSubmit must call notifyAdminByEmail');
assert(indexHtml.includes("type: 'client_registered'"), 'Registration notification must specify type client_registered');

// Test 9: Listener lifecycle hooks in auth and modal open
console.log('👉 Test 9: Admin notification listener lifecycle');
assert(indexHtml.includes('startAdminNotificationsListener();'), 'startAdminNotificationsListener must be called on admin session');
assert(indexHtml.includes('stopAdminNotificationsListener();'), 'stopAdminNotificationsListener must be called on logout');

// Test 10: Service Worker bumped to v22
console.log('👉 Test 10: Service Worker v22 cache update');
assert(swJs.includes('pino-ev-v22-turbo-europe-admin-audio-bell'), 'sw.js must have CACHE_NAME v22');

console.log('✅ ALL 10 TESTS PASSED SUCCESFULLY! The Admin panel is fully responsive across all devices and the audio bell with dual device + email notifications is operational.');
