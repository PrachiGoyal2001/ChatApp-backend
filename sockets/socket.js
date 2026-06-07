import { saveCallMessage, saveMessage } from "../controllers/messageController.js";

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

      // Send current online users
      socket.emit("online_users", Array.from(onlineUsers.keys()));

      // Only broadcast if first connection
      if (userSockets.size === 1) {
        socket.broadcast.emit("user_online", userId);
      }
    });

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("private_message", async (data) => {
      try {
        const { from, to } = data;

        if (!from || !to) return;

        const { conversation, messageDoc } = await saveMessage(data);

        const payload = {
          _id: messageDoc._id,
          conversationId: conversation._id,
          sender: messageDoc.sender,
          receiver: messageDoc.receiver,
          text: messageDoc.text,
          files: messageDoc.files || [],
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
    
    socket.on("call_user", async (data) => {
      const {
        to,
        from,
        offer,
        isVideoCall,
        calledUsername,
      } = data;

      io.to(to).emit("incoming_call", {
        from,
        offer,
        isVideoCall,
        calledUsername,
      });

      try {
        const { conversation, messageDoc } = await saveCallMessage({
          from,
          to,
          isVideoCall,
        });

        const payload = {
          _id: messageDoc._id,
          conversationId: conversation._id,
          sender: messageDoc.sender,
          receiver: messageDoc.receiver,
          text: messageDoc.text,
          files: messageDoc.files || [],
          messageType: messageDoc.messageType,
          call: messageDoc.call,
          createdAt: messageDoc.createdAt,
          read: messageDoc.read,
        };

        io.to(from).emit("new_message", payload);
        io.to(to).emit("new_message", payload);
      } catch (err) {
        console.error("Call message log error:", err);
      }
    });

    socket.on("answer_call", (data) => {
      const {
        to,
        answer,
      } = data;

      io.to(to).emit("call_answered", {
        answer,
      });
    });

    socket.on("ice_candidate", (data) => {
      const {
        to,
        candidate,
      } = data;

      io.to(to).emit("ice_candidate", {
        candidate,
      });
    });

    socket.on("video_upgrade_offer", ({ to, from, offer }) => {
      io.to(to).emit("video_upgrade_offer", {
        from,
        offer,
      });
    });

    socket.on("video_upgrade_answer", ({ to, answer }) => {
      io.to(to).emit("video_upgrade_answer", {
        answer,
      });
    });

    socket.on("reject_call", ({ to, reason=null }) => {
      io.to(to).emit("call_rejected",{
        reason,
      });
    });

    socket.on("end_call", ({ to }) => {
      io.to(to).emit("call_ended");
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
