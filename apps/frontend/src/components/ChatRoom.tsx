import type { IPublicChat, IPublicMessage } from "@chatty/shared/src";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const ChatRoom = ({ room }: { room: IPublicChat }) => {
  const [messages, setMessages] = useState<IPublicMessage[]>([]);
  const [newMessage, setNewMessage] = useState<IPublicMessage | null>(null);
  const { user } = useAuth() as any;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function getMessages() {
      try {
        const response = await axios
          .get(
            `${import.meta.env.PUBLIC_SERVER_API_V1_URL}/messages/${room.id}?include=true`
          )
          .then((res) => res.data)
          .catch((error) => {
            console.error("Error fetching chat room:", error);
            return { status: 500, data: [] };
          });

        if (response.status === 200) {
          setMessages(response.data.messages || []);
        } else if (response.status === 404) {
          return window.location.replace("/chats");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    getMessages();
  }, []);

  // Handle socket connection and cleanup
  // useEffect(() => {
  //   // Authenticate user first (simplified example)
  //   const username =
  //     localStorage.getItem("username") ||
  //     `User_${Math.floor(Math.random() * 10000)}`;
  //   setUser({ username });

  //   // Connect to Socket.IO server
  //   const socket = io(import.meta.env.PUBLIC_SOCKET_URL, {
  //     query: { roomId, username },
  //   });

  //   socketRef.current = socket;

  //   // Handle socket events
  //   socket.on("connect", () => {
  //     setIsConnected(true);
  //     console.log("Connected to chat server");
  //   });

  //   socket.on("message:new", (message) => {
  //     setMessages((prev) => [...prev, message]);
  //   });

  //   socket.on("disconnect", () => {
  //     setIsConnected(false);
  //     console.log("Disconnected from chat server");
  //   });

  //   // Cleanup function
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [roomId]);

  // Send message handler
  const sendMessage = (e: any) => {
    e.preventDefault();
    if (!newMessage?.text.trim() || !isConnected) return;

    (socketRef.current as any).emit("message:send", {
      roomId: room.id,
      message: newMessage,
    });

    setNewMessage(null);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    (messagesEndRef.current as any)?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!room) {
    window.location.replace("/chats");
    return;
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>{room.name}</h1>
        <div className="connection-status">
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.sender === user?.username ? "own-message" : ""}`}
            >
              <div className="message-sender">{msg.sender}</div>
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage?.text}
          onChange={(e) =>
            setNewMessage({
              ...newMessage,
              text: e.target.value,
              sender: user.id,
              timestamp: new Date(),
            })
          }
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={
            !isConnected || (!newMessage?.text.trim() && !newMessage?.media)
          }
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
