import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import sharedSession from "express-socket.io-session";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// ✅ import new socket setup
import { initSocket } from "./sockets/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/chatAppDb";
const isProduction = process.env.NODE_ENV === "production";

await connectDB();

app.set("trust proxy", 1);

app.use(cors({
  origin:  [
    "http://localhost:9000",
    "https://chat-app-frontend-smoky-seven.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URL }),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  },
});

app.use(sessionMiddleware);

// ✅ ROUTES
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/upload", uploadRoutes);

// ✅ CREATE HTTP SERVER
const server = createServer(app);

// ✅ INITIALIZE SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:9000",
      "https://chat-app-frontend-smoky-seven.vercel.app"
    ],
    credentials: true
  }
});


io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

// ✅ THEN INIT SOCKET
initSocket(io);

// ✅ START SERVER
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
