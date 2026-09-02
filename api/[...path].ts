import { createRepository } from '../server/src/applications/createRepository.js'
import { createApp } from '../server/src/app.js'
import { loadConfig } from '../server/src/config.js'

const config = loadConfig()
const repository = createRepository(config)

export default createApp({ config, repository })
