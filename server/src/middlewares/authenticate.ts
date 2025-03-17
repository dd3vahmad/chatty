import { NextFunction, Request, Response } from "express";
import { _res } from "../lib/utils";
import jwt from "jsonwebtoken";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies["x-auth-token"];

    if (!token) {
      _res.error(401, res, "Unauthenticated - No token provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      _res.error(401, res, "Unauthenticated - Invalid token.");
    }

    req.user = decoded;
  } catch (error) {
    next(error);
  }
};
