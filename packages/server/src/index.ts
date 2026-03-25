import { createServer } from 'http'
import { createApp } from './app'

const app = createApp()
const httpServer = createServer(app)
const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`Server running on :${PORT}`))
