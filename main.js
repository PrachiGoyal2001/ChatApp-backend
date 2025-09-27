import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { WebSocketServer } from "ws";
import { createServer } from "http"; 
import cors from "cors";

// Setup MongoDB connection
const mongoUrl = 'mongodb://localhost:27017/chatAppDb';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));


// User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', UserSchema);

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ], // exactly 2 users
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model("Conversation", ConversationSchema);

//Message Schema
const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);


const app = express();

// 👇 Allow frontend (Quasar) to access backend
app.use(cors({
  origin: "http://localhost:9000", // frontend URL
  credentials: true
}))
// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'supersecretkey',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl })
}));

// Routes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.send('User registered');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    // console.log('in server user is:', user)
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        res.send(user.id);
        console.log('after login Successful', req.session);
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.get('/users', async (req, res) => {
    try {
        // console.log(req,req.session.userId);
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized: Please log in");
        }

        // Fetch all users except the logged-in one
        const users = await User.find(
            { _id: { $ne: req.session.userId } }, // exclude logged-in user
            { password: 0 } // exclude password field
        );

        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).send("Server error while fetching users");
    }
});

app.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.session.userId;

    // Find the conversation between me and userId
    const conversation = await Conversation.findOne({
      participants: { $all: [myId, userId] }
    });

    if (!conversation) {
      return res.json([]); // no history yet
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "username");
    console.log('all the message between the participants', messages);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error while fetching messages");
  }
});


// 👇 Create a single server for both Express & WebSocket
const server = createServer(app);

// Attach WebSocket server to the same HTTP server
const webSocketServer = new WebSocketServer({ server });

// Store connected clients with their userId
const clients = new Map();

webSocketServer.on('connection', (socket) => {
  console.log('Client connected');

    // Step 1: Receive and store userId when user connects
  socket.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "register") {
        // Register user with their userId
        clients.set(data.userId, socket);
        console.log(`User registered: ${data.userId}`);
      }

      if (data.type === "private_message") {

        // Step 1: Find or create a conversation between 2 users
        let conversation = await Conversation.findOne({
          participants: { $all: [data.from, data.to] }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [data.from, data.to]
          });
          await conversation.save();
        }

        // Step 2: Save the message
        const messageDoc = new Message({
          conversationId: conversation._id,
          senderId: data.from,
          content: data.message
        });
        await messageDoc.save();

        // Step 3: Deliver message in real-time
        const targetSocket = clients.get(data.to);
        if (targetSocket && targetSocket.readyState === socket.OPEN) {
          targetSocket.send(
            JSON.stringify({
              from: data.from,
              message: data.message,
              conversationId: conversation._id,
              createdAt: messageDoc.createdAt
            })
          );
        }
      }
    } catch (err) {
      console.error("Invalid message format", err);
    }
  });
   socket.on("close", () => {
    console.log("Client disconnected");
    // Remove disconnected user
    for (let [userId, s] of clients.entries()) {
      if (s === socket) {
        clients.delete(userId);
        break;
      }
    }
  });

    // socket.on('message', (message) => {
    //     webSocketServer.clients.forEach((client) => {
    //         if (client.readyState === socket.OPEN) {
    //             client.send(message.toString());
    //         }
    //     });
    // });

    // socket.on('close', () => {
    //     console.log('Client disconnected');
    // });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Server (Express + WebSocket) running on http://localhost:${PORT}`);
    console.log(`✅ WebSocket server available at ws://localhost:${PORT}`);
});