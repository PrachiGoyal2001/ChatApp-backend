import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";
import { setupWebSocket } from "./websocket/socketHandler.js";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/chatAppDb";
const isProduction = process.env.NODE_ENV === "production";

dotenv.config();
await connectDB();

app.set("trust proxy", 1);

app.use(cors({
  origin:  [
    "http://localhost:9000",
    "https://chat-app-frontend-smoky-seven.vercel.app/"
  ],
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URL }),
  cookie: {
    httpOnly: true,
    secure: isProduction,        // ✅ REQUIRED for HTTPS (Render)
    sameSite: isProduction ? "none" : "lax",    // ✅ REQUIRED for cross-origin
  },
}));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
