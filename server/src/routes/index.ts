import { authenticate } from "../middlewares/authenticate";
import authRoutes from "./auth";
import userRoutes from "./user";
import { Router } from "express";

const protectedRoutes = Router();

protectedRoutes.use("/user", userRoutes);

export { authRoutes, protectedRoutes };
