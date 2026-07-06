import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import path from 'path';

const app = express();

// ─── LOGGING ──────────────────────────────────────────────────────────────────
app.use(pinoHttp({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
}));

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
}));

// ─── COMPRESSION ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── WEBHOOK RAW BODY ─────────────────────────────────────────────────────────
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── SESSION ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'xpresspro-fx-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ─── GLOBAL RATE LIMITER ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// ─── AUTH RATE LIMITER ────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts.' }
});

// ─── LIVE CHAT RATE LIMITER ───────────────────────────────────────────────────
const liveChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Live chat rate limit reached.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/live-chat/', liveChatLimiter);

// ─── TRUST PROXY ──────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── HEALTH CHECKS ────────────────────────────────────────────────────────────
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'XpressPro FX API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'XpressPro FX API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ─── STATIC FILE SERVING ──────────────────────────────────────────────────────
const staticPath = path.join(__dirname, '../../public');
app.use(express.static(staticPath));

// ─── PLATFORM GATE ────────────────────────────────────────────────────────────
app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
  const platform = req.headers['x-platform'];
  if (!platform) {
    return res.status(400).json({
      success: false,
      message: 'Missing platform identifier.'
    });
  }
  next();
});

// ─── API ROUTES PLACEHOLDER ───────────────────────────────────────────────────
// Mount your route modules here as they are built
// app.use('/api/auth', authRouter);
// app.use('/api/accounts', accountsRouter);
// app.use('/api/trades', tradesRouter);
// app.use('/api/transactions', transactionsRouter);
// app.use('/api/market', marketRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/webhooks', webhooksRouter);
// app.use('/api/live-chat', liveChatRouter);

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any).status || 500;
  console.error(`[ERROR] ${err.message}`);
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message
  });
});

export default app;
