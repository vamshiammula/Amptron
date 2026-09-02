import path from 'node:path'
import { createRepository } from './applications/createRepository.js'
import { createApp } from './app.js'
import { ConfigError, loadConfig } from './config.js'

function start(): void {
  let config
  try {
    config = loadConfig()
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`\n${error.message}\n`)
      process.exit(1)
    }
    throw error
  }

  const clientDir = path.resolve(process.env.CLIENT_DIR ?? 'dist')
  const repository = createRepository(config)
  const app = createApp({ config, repository, clientDir })

  const server = app.listen(config.port, config.host, () => {
    const store =
      config.store === 'memory'
        ? 'in-memory (no data is persisted)'
        : `Supabase (${config.supabase?.canRead ? 'service-role key' : 'publishable key, write-only'})`

    console.log(`[api] listening on http://${config.host}:${config.port}`)
    console.log(`[api] environment: ${config.nodeEnv}`)
    console.log(`[api] applications store: ${store}`)
    if (config.store === 'supabase' && !config.supabase?.canRead) {
      console.warn(
        '[api] SUPABASE_SERVICE_ROLE_KEY is unset. Dealer login creation and application reads are disabled until it is set on the server.',
      )
    }
    if (config.serveStatic) {
      console.log(`[api] serving client from ${clientDir}`)
    }
    if (!config.ipHashSalt) {
      console.warn(
        '[api] IP_HASH_SALT is not set: submissions are stored without an IP hash.',
      )
    }
  })

  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} received, shutting down`)
    server.close(() => process.exit(0))
    // Force exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start()
