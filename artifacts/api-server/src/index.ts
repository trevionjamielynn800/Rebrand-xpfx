import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import pino from 'pino'
import pinoHttp from 'pino-http'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
})

const app: Express = express()

// === ENVIRONMENT VALIDATION ===
const REQUIRED_ENV = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'JWT_SECRET',
  'NODE_ENV',
  'ALLOWED_ORIGINS',
]

const missing = REQUIRED_ENV.filter((v) => !process.env[v])
if (missing.length > 0) {
  logger.error('STARTUP FAILED — Missing env vars:', missing.join(', '))
  process.exit(1)
}

const PORT = parseInt(process.env.PORT || '8080', 10)
const NODE_ENV = process.env.NODE_ENV

logger.info({
  PORT,
  NODE_ENV,
  message: 'Environment variables validated successfully',
})

// === HEALTH CHECK FIRST (before all middleware) ===
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    port: PORT,
  })
})

// === LOGGING MIDDLEWARE ===
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
)

// === SECURITY MIDDLEWARE ===
app.use(helmet())
app.use(compression())

// === BODY PARSING ===
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// === CORS ===
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        logger.warn({ origin }, 'CORS rejected origin')
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

// === RATE LIMITING ===
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many auth attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// === ROUTES ===
app.use('/api/auth', authLimiter)

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  })
})

// === GLOBAL ERROR HANDLER (must be last) ===
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    message: 'Unhandled error',
  })
  res.status(err.status || 500).json({
    error:
      NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
  })
})

// === CATCH 404 ===
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// === DATABASE + SERVER START ===
async function startServer() {
  try {
    logger.info('Starting server...')
    app.listen(PORT, '0.0.0.0', () => {
      logger.info({
        PORT,
        NODE_ENV,
        message: `✅ Server running on 0.0.0.0:${PORT}`,
      })
      logger.info(`✅ Health check: http://0.0.0.0:${PORT}/healthz`)
    })
  } catch (error: any) {
    logger.error({
      error: error.message,
      stack: error.stack,
      message: '❌ STARTUP FAILED',
    })
    process.exit(1)
  }
}

// === GRACEFUL SHUTDOWN ===
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

startServer()
