import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

export const E2E_ADMIN_KEY = 'e2e-admin-key-must-be-long-enough'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  /**
   * Serves the real production bundle from the Express server, with the
   * in-memory store so the suite needs no Supabase credentials.
   */
  webServer: {
    command: 'npm run build && node dist-server/server/src/index.js',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    /**
     * Set explicitly rather than inherited, so a developer's local .env cannot
     * change how the suite behaves.
     */
    env: {
      NODE_ENV: 'production',
      APPLICATIONS_STORE: 'memory',
      PORT: String(PORT),
      HOST: '127.0.0.1',
      ADMIN_API_KEY: E2E_ADMIN_KEY,
      IP_HASH_SALT: 'e2e-ip-hash-salt-value',
      CSP_UPGRADE_INSECURE_REQUESTS: 'false',
      CORS_ORIGINS: '',
      // Every test shares 127.0.0.1, so the production limit would throttle the run.
      RATE_LIMIT_MAX: '1000',
    },
  },
})
