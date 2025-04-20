import { NextFunction, Response } from "express";
import { _res } from "../lib/utils";
import jwt from "jsonwebtoken";
import { IRequestWithUser } from "../types/interfaces";
import { IUser } from "../models/user";
import { getUser } from "../lib/workos";

export const authenticate = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies["x-auth-token"];

    if (!token) {
      _res.error(401, res, "Unauthenticated - No token provided.");
    }

    if (!!process.env.WORKOS) {
      const user = await getUser(token);
      if (!user) {
        _res.error(401, res, "Unauthenticated - Invalid token.");
      }

      req.user = { id: user.id } as any as IUser;
      next();
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded) {
        _res.error(401, res, "Unauthenticated - Invalid token.");
        return;
      }

      req.user = decoded as any as IUser;
      next();
    }
  } catch (error) {
    next(error);
  }
};
