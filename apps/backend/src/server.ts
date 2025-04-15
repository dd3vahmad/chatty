import app from "./app";
import * as dotenv from "dotenv";
import { connectDb } from "./lib/db";
import { Server } from "socket.io";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import ChatRoom from "./models/chatroom";
import User, { IUser } from "./models/user";
import mongoose from "mongoose";
import { IFriend } from "./models/friend";
import { SocketEvents } from "@chatty/shared/src";

dotenv.config(); // Load environment variables from .env file
connectDb(); // Connect to the database

// Socket.io initialization
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    allowedHeaders: ["x-auth-token"],
    credentials: true,
  },
});

// Make io available in routes
app.set("io", io);

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    // Get token from handshake auth or headers
    const token =
      socket.handshake.auth.token || socket.handshake.headers["x-auth-token"];
    const guestId = socket.handshake.auth.guestId;

    // If no token or guestId, still allow connection but mark as unauthenticated
    if (!token && !guestId) {
      socket.data.authenticated = false;
      return next();
    }

    // For registered users, verify JWT
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any as IUser;
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      // Set user data on socket
      socket.data.user = user;
      socket.data.authenticated = true;
      socket.data.isGuest = false;
      return next();
    }

    // For guest users
    if (guestId) {
      // Find guest in any chat room
      const chatRoom = await ChatRoom.findOne({ "guests._id": guestId });

      if (!chatRoom) {
        return next(new Error("Guest not found"));
      }

      const guest = chatRoom.guests.find((g) => g._id === guestId);

      if (!guest) {
        return next(new Error("Guest not found"));
      }

      // Set guest data on socket
      socket.data.user = guest;
      socket.data.authenticated = true;
      socket.data.isGuest = true;
      return next();
    }

    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

io.on(SocketEvents.CONNECTION, (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Join a chat room
  socket.on(SocketEvents.JOIN_ROOM, async ({ roomId, userId, isGuest }) => {
    try {
      // Add socket to room
      socket.join(roomId);

      // Get user info
      let userInfo: any;

      if (isGuest) {
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) return;

        const guest = chatRoom.guests.find((g) => g._id === userId);
        if (!guest) return;

        userInfo = {
          _id: guest._id,
          username: guest.username,
          pic: guest.pic,
          isGuest: true,
        };
      } else {
        const user = await User.findById(userId).select("username pic");
        if (!user) return;

        userInfo = {
          _id: user._id,
          username: user.username,
          pic: user.pic,
          isGuest: false,
        };

        // For registered users, check if other users in room have custom names for this user
        const chatRoom = await ChatRoom.findById(roomId).populate(
          "members",
          "_id"
        );
        if (chatRoom) {
          const Friend = mongoose.model("Friend");
          const memberIds = chatRoom.members.map((m) => m._id.toString());

          // For each member, check if they have a custom name for the joining user
          for (const memberId of memberIds) {
            if (memberId === userId) continue;

            const friendEntry = (await Friend.findOne({
              createdBy: memberId,
              userId: userId,
            }).lean()) as any as IFriend;

            if (friendEntry && friendEntry.name) {
              // Send a personalized 'user:online' event to this specific member
              io.to(`user:${memberId}`).emit(SocketEvents.USER_ONLINE, {
                roomId,
                user: {
                  ...userInfo,
                  username: friendEntry.name,
                  originalUsername: userInfo.username,
                },
              });
            }
          }
        }
      }

      // Notify others in room (general broadcast for those without custom names)
      socket.to(roomId).emit(SocketEvents.USER_ONLINE, {
        roomId,
        user: userInfo,
      });

      console.log(`User ${userInfo.username} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  });

  // Leave a chat room
  socket.on(SocketEvents.LEAVE_ROOM, ({ roomId, userId, isGuest }) => {
    socket.leave(roomId);
    socket
      .to(roomId)
      .emit(SocketEvents.USER_OFFLINE, { roomId, userId, isGuest });
    console.log(`User ${userId} left room ${roomId}`);
  });

  // User typing indicator
  socket.on(
    SocketEvents.USER_TYPING,
    ({ roomId, userId, username, isTyping }) => {
      socket
        .to(roomId)
        .emit(SocketEvents.USER_TYPING, { roomId, userId, username, isTyping });
    }
  );

  // Handle disconnect
  socket.on(SocketEvents.DISCONNECT, () => {
    console.log(`Connection closed: ${socket.id}`);

    if (socket.data.user) {
      // Notify all rooms that user was in
      io.emit(SocketEvents.USER_OFFLINE, {
        userId: socket.data.user._id,
        isGuest: socket.data.isGuest,
      });
    }
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running on http://localhost:${PORT}`);
});
