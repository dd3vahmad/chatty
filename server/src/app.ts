import express, { NextFunction, Request, Response } from "express";

import { authRoutes } from "./routes";
import { _res } from "./lib/utils";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({ message, failed: true }) as any;
});

app.get("/", (req: Request, res: Response) => {
  res.render("i", {
    title: `Hi ${req.hostname}! Welcome to Chatty Backend.`,
  });
});

export default app;
