import { createServer } from '../../../frontend/node_modules/vite/dist/node/index.js'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const qaDirectory = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(qaDirectory, '../../../frontend')

const server = await createServer({
  root: frontendRoot,
  configFile: resolve(frontendRoot, 'vite.config.ts'),
  envFile: false,
})

await server.listen()
server.printUrls()
await new Promise(() => {})
