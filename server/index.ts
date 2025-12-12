import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedDatabase } from "./seed";
import "dotenv/config";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

export const log = (message: string, source = "express") => {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: any = undefined;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJsonResponse = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(
        `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms :: ${JSON.stringify(
          capturedJsonResponse
        )}`
      );
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  await seedDatabase();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => log(`Server running at http://localhost:${port}`)
  );
})();
