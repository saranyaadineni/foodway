import express from "express";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import superadminRouter from "./routes/superadmin.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import { socketHandler } from "./socket.js";
import { autoRegenerateOtps } from "./controllers/order.controllers.js";

const app = express();
app.set('trust proxy', 1); // Trust Cloudflare proxy

// 🛡️ Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // Disable CSP if you have issues with S3 or external images
}));

// ⚡ Compression
app.use(compression());

// 📝 Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 🚦 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", limiter);

const server = http.createServer(app);
const port = process.env.PORT || 3011;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://foody.speshway.site",
  "http://foody.speshway.site"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === "*") return true;
      try {
        return new URL(origin).hostname === new URL(allowedOrigin).hostname;
      } catch {
        return origin === allowedOrigin;
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));


app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

socketHandler(io);


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/superadmin", superadminRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/rating", ratingRouter);

// Extra compatibility: allow backends where /api is stripped by the proxy
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/superadmin", superadminRouter);
app.use("/shop", shopRouter);
app.use("/item", itemRouter);
app.use("/order", orderRouter);
app.use("/categories", categoryRouter);
app.use("/rating", ratingRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

cron.schedule("0 */2 * * *", () => {
  console.log("Running automatic OTP regeneration...");
  autoRegenerateOtps();
});


const startServer = async () => {
  try {
    await connectDb(); // ✅ connect DB first

    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📡 Allowed Origins: ${allowedOrigins.join(", ")}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use.`);
        console.log(`💡 Suggestion: Kill the process using this port or try a different one (e.g., PORT=${parseInt(port) + 1} npm start)`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
      }
    });

  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
};

startServer();

// Cloudflare / Proxy resilience
server.keepAliveTimeout = 65000; 
server.headersTimeout = 66000; 

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Optional: Graceful shutdown
  // process.exit(1);
});
