import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fxRateScheduler } from "./scheduler";
// MEMORY LEAK FIX: Import memory leak monitor for active production monitoring
import { memoryLeakMonitor } from "./memory-leak-monitor";
// BOOTSTRAP FIX: Import secret loading and database initialization
import { getReplitSecretsAsync, debugSecretSources } from "./secretLoader";
import { initDb } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // CRITICAL: Bootstrap sequence - load secrets first, then initialize database
  console.log('🚀 [BOOTSTRAP] Starting application bootstrap sequence...');
  
  try {
    // Step 1: Debug current secret status
    console.log('🔍 [BOOTSTRAP] Checking secret loading status...');
    debugSecretSources();
    
    // Step 2: Load critical secrets for system operation
    console.log('🔑 [BOOTSTRAP] Loading critical secrets...');
    const secrets = await getReplitSecretsAsync(['DATABASE_URL', 'OPENAI_API_KEY']);
    const { DATABASE_URL, OPENAI_API_KEY } = secrets;
    
    // Step 3: Validate critical secrets
    if (!DATABASE_URL) {
      console.error('❌ [BOOTSTRAP] CRITICAL: DATABASE_URL not found. Check javascript_database integration.');
      console.error('❌ [BOOTSTRAP] System will continue but will use memory storage instead of PostgreSQL.');
    } else {
      console.log('✅ [BOOTSTRAP] DATABASE_URL loaded successfully');
    }
    
    if (!OPENAI_API_KEY) {
      console.error('❌ [BOOTSTRAP] WARNING: OPENAI_API_KEY not found. Check javascript_openai integration.');
      console.error('❌ [BOOTSTRAP] AI features will be disabled.');
    } else {
      console.log('✅ [BOOTSTRAP] OPENAI_API_KEY loaded successfully');
    }
    
    // Step 4: Initialize database if DATABASE_URL is available
    if (DATABASE_URL) {
      console.log('📦 [BOOTSTRAP] Initializing database connection...');
      try {
        await initDb();
        console.log('✅ [BOOTSTRAP] Database initialized successfully');
      } catch (dbError) {
        console.error('❌ [BOOTSTRAP] Database initialization failed:', dbError);
        console.error('❌ [BOOTSTRAP] System will continue with memory storage.');
      }
    } else {
      console.log('⚠️ [BOOTSTRAP] Skipping database initialization - using memory storage');
    }
    
    console.log('✅ [BOOTSTRAP] Bootstrap sequence completed successfully');
    
  } catch (error) {
    console.error('❌ [BOOTSTRAP] Bootstrap sequence failed:', error);
    console.error('❌ [BOOTSTRAP] System will continue with degraded functionality.');
  }
  
  // Continue with normal server setup
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start FX rate scheduler after server is ready
    try {
      const schedulerStarted = fxRateScheduler.start();
      if (schedulerStarted) {
        log('FX Rate Scheduler started successfully');
      } else {
        log('FX Rate Scheduler startup skipped (may be disabled or already running)');
      }
    } catch (error) {
      log(`Warning: Failed to start FX Rate Scheduler: ${error}`);
    }
  });
})();
