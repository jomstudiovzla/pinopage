// Tests E2E de flux réels (navigateur + émulateurs Firebase Auth / Realtime Database).
// Lancement : pnpm test:e2e  (démarre les émulateurs puis Playwright).
import { defineConfig, devices } from '@playwright/test';

const PORT = 5510;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 serve.py ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // La CSP de production bloque 127.0.0.1 : contournée uniquement pour parler aux émulateurs.
    { name: 'chromium-desktop', testIgnore: /csp\.spec/, use: { ...devices['Desktop Chrome'], bypassCSP: true } },
    { name: 'webkit-mobile', testIgnore: /csp\.spec/, use: { ...devices['iPhone 13'], bypassCSP: true } },
    // CSP réelle appliquée, sans émulateur : carte, en-têtes, manifeste, aucune violation.
    { name: 'csp', testMatch: /csp\.spec/, use: { ...devices['Desktop Chrome'] } },
  ],
});
