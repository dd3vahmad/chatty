import { NextFunction, Response } from "express";
import { _res } from "../lib/utils";
import jwt from "jsonwebtoken";
import { IRequestWithUser } from "../types/interfaces";
import { getUser, handleWorkOSAuth } from "../lib/workos";
import User from "../models/user";

export const authenticate = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies["x-auth-token"];

    if (!token) {
      _res.error(401, res, "Unauthenticated - No token provided.");
      return;
    }

    if (process.env.WORKOS_ENABLED === "true") {
      try {
        const workosUser = await getUser(token);
        if (!workosUser) {
          _res.error(401, res, "Unauthenticated - Invalid WorkOS session.");
          return;
        }

        const user = await handleWorkOSAuth(workosUser);
        req.user = user;
        return next();
      } catch (workosError) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById((decoded as any).id);

          if (!user) {
            _res.error(401, res, "Unauthenticated - User not found.");
            return;
          }

          req.user = user;
          return next();
        } catch (jwtError) {
          _res.error(401, res, "Unauthenticated - Invalid token.");
          return;
        }
      }
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById((decoded as any).id);

        if (!user) {
          _res.error(401, res, "Unauthenticated - User not found.");
          return;
        }

        req.user = user;
        return next();
      } catch (error) {
        _res.error(401, res, "Unauthenticated - Invalid token.");
        return;
      }
    }
  } catch (error) {
    next(error);
  }
};
