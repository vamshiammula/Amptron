import { existsSync, statSync } from 'node:fs'

if (
  !existsSync('dist/index.html') ||
  !existsSync('dist-server/server/src/index.js')
) {
  console.error('[preview] Build the app first with npm run build.')
  process.exitCode = 1
} else if (
  existsSync('.env') &&
  statSync('.env').size > 0 &&
  statSync('.env').blocks === 0
) {
  console.error(
    '[preview] The local .env file is cloud-only. Download it before starting the configured API.',
  )
  process.exitCode = 1
} else {
  process.env.HOST = '127.0.0.1'
  process.env.PORT = process.env.PORT || '5173'
  process.env.SERVE_STATIC = 'true'
  console.log(
    '[preview] Serving the last production build. Run npm run build after source changes.',
  )
  await import('../dist-server/server/src/index.js')
}
