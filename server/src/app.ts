import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { authRoutes, protectedRoutes } from "./routes";
import { _res } from "./lib/utils";
import { authenticate } from "./middlewares/authenticate";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL }));

app.use("/api/auth", authRoutes);
app.use("/api/", authenticate, protectedRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = 500;
  const message = err.message || "Internal Server Error";

  // I don't know what void means but I hate unused code...
  void next;
  void req;

  return res.status(statusCode).json({ message, failed: true }) as any;
});

app.get("/", (req: Request, res: Response) => {
  res.render("i", {
    title: `Hi ${req.hostname}! Welcome to Chatty Backend.`,
  });
});

export default app;
