import authRoutes from "./auth";
import userRoutes from "./user";
import messagesRoutes from "./message";
import { Router } from "express";

const protectedRoutes = Router();

protectedRoutes.use("/users", userRoutes);
protectedRoutes.use("/messages", messagesRoutes);

export { authRoutes, protectedRoutes };
