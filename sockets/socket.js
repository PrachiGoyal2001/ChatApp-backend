import { handlePrivateMessage } from "./socketService.js";

export const initSocket = (io) => {
  const onlineUsers = new Map();
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId) => {
      socket.join(userId);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }

      const userSockets = onlineUsers.get(userId);
      userSockets.add(socket.id);

      // ✅ Send current online users
      socket.emit("online_users", Array.from(onlineUsers.keys()));

      // ✅ Only broadcast if first connection
      if (userSockets.size === 1) {
        socket.broadcast.emit("user_online", userId);
      }
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("private_message", async (data) => {
      try {
        const { from, to, message } = data;

        if (!from || !to || !message) return;

        const { conversation, messageDoc } = await handlePrivateMessage(data);

        const payload = {
          _id: messageDoc._id,
          conversationId: conversation._id,
          sender: messageDoc.sender,
          receiver: messageDoc.receiver,
          text: messageDoc.text,
          createdAt: messageDoc.createdAt,
          read: messageDoc.read,
        };

        io.to(to).emit("new_message", payload);
        socket.emit("message_sent", payload);
      } catch (err) {
        console.error("Socket Error:", err);
      }
    });

    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing", {
        conversationId,
        userId,
      });
    });

    socket.on("stop_typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("stop_typing", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      let disconnectedUserId = null;

      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);

          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            disconnectedUserId = userId;
          }

          break;
        }
      }

      if (disconnectedUserId) {
        socket.broadcast.emit("user_offline", disconnectedUserId);
      }

      console.log("User disconnected:", socket.id);
    });
  });
};
