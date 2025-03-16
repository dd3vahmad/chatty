import express, { NextFunction, Request, Response } from "express";

import { authRoutes } from "./routes";
import { _res } from "./lib/utils";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((error: Error, _: Request, res: Response) => {
  _res.error(500, res, `Internal Server Error: ${error.message}`);
});

export default app;
