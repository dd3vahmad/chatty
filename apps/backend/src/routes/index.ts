import authRoutes from "./auth";
import userRoutes from "./user";
import messagesRoutes from "./message";
import chatroomsRoutes from "./chatroom";
import { Router } from "express";

const protectedRoutes = Router();

protectedRoutes.use("/users", userRoutes);
protectedRoutes.use("/messages", messagesRoutes);
protectedRoutes.use("/chatrooms", chatroomsRoutes);

export { authRoutes, protectedRoutes };
