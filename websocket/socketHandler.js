import { WebSocketServer } from "ws";
import { handlePrivateMessage } from "./socketService.js";

const clients = new Map();

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.type === "register") {
          clients.set(data.userId, socket);
        }

        if (data.type === "private_message") {
          const { conversation, messageDoc } =
            await handlePrivateMessage(data);

          const targetSocket = clients.get(data.to);

          if (targetSocket?.readyState === socket.OPEN) {
            targetSocket.send(
              JSON.stringify({
                from: data.from,
                message: data.message,
                conversationId: conversation._id,
                createdAt: messageDoc.createdAt,
              })
            );
          }
        }
      } catch (err) {
        console.error("WS Error:", err);
      }
    });

    socket.on("close", () => {
      for (let [userId, s] of clients.entries()) {
        if (s === socket) {
          clients.delete(userId);
          break;
        }
      }
    });
  });
};
