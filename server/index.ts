import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedDatabase } from "./seed";
import dotenv from "dotenv";

dotenv.config(); // ✅ VERY IMPORTANT

const app = express();
const httpServer = createServer(app);

/* ================= RAW BODY SUPPORT ================= */
declare module "http" {
  interface IncomingMessage {
    rawBody: Buffer;
  }
}

/* ================= MIDDLEWARE ================= */
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static("uploads"));

/* ================= LOGGER ================= */
export const log = (message: string, source = "express") => {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(
        `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms :: ${
          capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
        }`
      );
    }
  });

  next();
});

/* ================= MAIN BOOTSTRAP ================= */
(async () => {
  try {
    // ✅ Register all API routes (auth, otp, payment, admin, etc.)
    await registerRoutes(httpServer, app);

    // ✅ Seed DB (safe, idempotent)
    await seedDatabase();

    // ✅ Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Server Error:", err);
      res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
      });
    });

    // ✅ Frontend handling
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
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
