import express from "express";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { Server } from "socket.io";

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
const server = http.createServer(app);
const port = process.env.PORT || 3011;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://foody.speshway.site"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
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


server.listen(port, async () => {
  try {
    await connectDb();
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Allowed Origins: ${allowedOrigins.join(", ")}`);
  } catch (error) {
    console.error("❌ Startup error:", error);
  }
});

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
