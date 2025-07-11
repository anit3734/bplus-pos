import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { setupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
  secret: 'bplus-pos-secure-session-secret-key-production-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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

// Simple health check at root for Railway
app.get("/", (req, res) => {
  res.json({ 
    status: "B-Plus POS is running", 
    timestamp: new Date().toISOString(),
    database: "connected"
  });
});

(async () => {
  try {
    console.log('🚀 Starting B-Plus POS server...');
    
    // Initialize database first
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    const server = setupRoutes(app);

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

  // ALWAYS serve the app on the correct port for Railway
  // Railway provides PORT environment variable, fallback to 5000
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server serving on port ${port}`);
    console.log(`📱 B-Plus POS is ready at http://0.0.0.0:${port}`);
  });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      console.error(`
🔧 Setup Instructions:
1. Copy .env.example to .env
2. Set DATABASE_URL in your .env file
3. For production: Set DATABASE_URL in your platform's environment variables

See PRODUCTION-SETUP.md for detailed instructions.
`);
    }
    
    process.exit(1);
  }
})();
