import { parseEnv } from 'node:util'
import { createServer } from 'node:net'
import { readdir, stat, readFile } from 'node:fs/promises'

// Fail before Vite/tsx read cloud placeholders and appear to hang indefinitely.
async function checkLocal(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) await checkLocal(path)
    else if (/\.(tsx?|css|json)$/.test(entry.name)) {
      const file = await stat(path)
      if (file.size > 0 && file.blocks === 0) {
        throw new Error(
          `Source file is not available locally: ${path}. Download the project and run it from a folder outside iCloud, such as ~/Developer/Amptron.`,
        )
      }
    }
  }
}
async function checkPort(port) {
  await new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', () =>
      reject(
        new Error(
          `Port ${port} is unavailable. Stop the existing Amptron session before starting another.`,
        ),
      ),
    )
    server.listen(port, '127.0.0.1', () => server.close(resolve))
  })
}
try {
  await Promise.all(['src', 'server/src', 'shared'].map(checkLocal))
  let env = {}
  try {
    const file = await stat('.env')
    if (file.size > 0 && file.blocks === 0)
      throw new Error('.env is cloud-only. Download it before starting the app.')
    env = parseEnv(await readFile('.env', 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await Promise.all(
    [5173, Number(process.env.PORT || env.PORT || 3001)].map(checkPort),
  )
} catch (error) {
  console.error(`[dev] ${error.message}`)
  process.exitCode = 1
}
