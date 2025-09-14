import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";

// Don't validate environment variables at import time
// This allows the server to start in development without full config

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// One-time session middleware initialization
let sessionMiddleware: RequestHandler | null = null;
let sessionInitialized = false;

export function getSession(): RequestHandler {
  // Perform one-time initialization
  if (!sessionInitialized) {
    sessionInitialized = true;
    
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const isProduction = process.env.NODE_ENV === 'production';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasSessionSecret = !!process.env.SESSION_SECRET;

    // Validate session secret
    if (!hasSessionSecret) {
      if (isProduction) {
        console.error('SESSION_SECRET is required in production');
        throw new Error('SESSION_SECRET is required in production');
      } else {
        console.warn('SESSION_SECRET not set, using default for development (not secure)');
      }
    }

    let sessionStore;
    
    // Use PostgreSQL store if DATABASE_URL is available, otherwise use MemoryStore
    if (hasDatabaseUrl) {
      try {
        const pgStore = connectPg(session);
        sessionStore = new pgStore({
          conString: process.env.DATABASE_URL,
          createTableIfMissing: true,
          ttl: Math.floor(sessionTtl / 1000), // convert to seconds for pg store
          tableName: "sessions",
        });
        console.log('Using PostgreSQL session store');
      } catch (error) {
        console.error('Failed to initialize PostgreSQL session store:', error);
        if (isProduction) {
          throw error;
        }
        // Fall back to memory store in development
        const MemStore = MemoryStore(session);
        sessionStore = new MemStore({ checkPeriod: sessionTtl });
        console.warn('Falling back to memory session store');
      }
    } else {
      const MemStore = MemoryStore(session);
      sessionStore = new MemStore({ checkPeriod: sessionTtl });
      console.log('Using memory session store (development only)');
    }
    
    sessionMiddleware = session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction, // Only use secure cookies in production (HTTPS)
        maxAge: sessionTtl,
      },
    });
  }

  return sessionMiddleware!;
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Validate required environment variables
  const replitDomains = process.env.REPLIT_DOMAINS;
  const replId = process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!replitDomains) {
    if (isProduction) {
      throw new Error('REPLIT_DOMAINS is required in production');
    } else {
      console.warn('REPLIT_DOMAINS not set, auth may not work properly in development');
    }
  }
  
  if (!replId) {
    if (isProduction) {
      throw new Error('REPL_ID is required in production');
    } else {
      console.warn('REPL_ID not set, auth may not work properly in development');
    }
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only proceed with OIDC setup if we have the required config
  if (!replitDomains || !replId) {
    console.warn('Skipping OIDC setup due to missing configuration');
    return;
  }

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      try {
        const user = {};
        updateUserSession(user, tokens);
        await upsertUser(tokens.claims());
        verified(null, user);
      } catch (error) {
        console.error('Error in auth verify callback:', error);
        verified(error as Error);
      }
    };

    for (const domain of replitDomains.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    // For development - also register a strategy for localhost
    if (process.env.NODE_ENV === 'development') {
      const localhostStrategy = new Strategy(
        {
          name: `replitauth:localhost`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `http://localhost:5000/api/callback`,
        },
        verify,
      );
      passport.use(localhostStrategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: replId,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  } catch (error) {
    console.error('Error setting up authentication:', error);
    if (isProduction) {
      throw error;
    } else {
      console.warn('Authentication setup failed, continuing without auth in development');
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Development bypass for in-memory storage
    if (process.env.NODE_ENV === 'development') {
      // Auto-provision a dev user if not authenticated
      const devUser = {
        claims: {
          sub: 'dev-user-1',
          email: 'dev@pharma.com',
          first_name: 'Dev',
          last_name: 'User'
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      
      // Ensure dev user exists in storage
      const { storage } = await import("./storage");
      await storage.upsertUser({
        id: devUser.claims.sub,
        email: devUser.claims.email,
        firstName: devUser.claims.first_name,
        lastName: devUser.claims.last_name,
        profileImageUrl: null,
      });
      
      // Attach user to request
      (req as any).user = devUser;
      return next();
    }
    
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: "Authentication error" });
  }
};
