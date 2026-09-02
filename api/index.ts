import type { IncomingMessage, ServerResponse } from 'node:http'
import { createRepository } from '../server/src/applications/createRepository.js'
import { createApp } from '../server/src/app.js'
import { loadConfig } from '../server/src/config.js'
import { restoreVercelApiUrl } from '../server/src/vercelApiUrl.js'

const config = loadConfig()
const app = createApp({
  config,
  repository: createRepository(config),
})

export default function handler(req: IncomingMessage, res: ServerResponse) {
  req.url = restoreVercelApiUrl(req.url, req.headers['x-forwarded-uri'])
  app(req, res)
}
