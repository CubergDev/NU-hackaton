import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { ticketsRoutes } from './routes/tickets'
import { assignmentsRoutes } from './routes/assignments'
import { managersRoutes } from './routes/managers'
import { statsRoutes } from './routes/stats'
import { starTaskRoutes } from './routes/star-task'
import { ensureBucket } from './services/minio'
import { config } from './lib/config'

// Ensure MinIO bucket exists on startup
await ensureBucket()

const app = new Elysia()
  .use(cors({ origin: ['http://localhost:3000'] }))
  .use(swagger({ path: '/docs' }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(ticketsRoutes)
  .use(assignmentsRoutes)
  .use(managersRoutes)
  .use(statsRoutes)
  .use(starTaskRoutes)
  .listen(config.port)

console.log(`🔥 FIRE API running on http://localhost:${config.port}`)
console.log(`📖 Swagger: http://localhost:${config.port}/docs`)
