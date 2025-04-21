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
      return _res.error(401, res, "Unauthenticated - No token provided.");
    }

    if (process.env.WORKOS_ENABLED === "true") {
      try {
        const workosUser = await getUser(token);
        if (!workosUser) {
          return _res.error(
            401,
            res,
            "Unauthenticated - Invalid WorkOS session."
          );
        }

        const user = await handleWorkOSAuth(workosUser);
        req.user = user;
        return next();
      } catch (workosError) {
        console.error("WorkOS auth error:", workosError);
        // If WorkOS auth fails, try falling back to JWT auth
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById((decoded as any).id);

          if (!user) {
            return _res.error(401, res, "Unauthenticated - User not found.");
          }

          req.user = user;
          return next();
        } catch (jwtError) {
          return _res.error(401, res, "Unauthenticated - Invalid token.");
        }
      }
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById((decoded as any).id);

        if (!user) {
          return _res.error(401, res, "Unauthenticated - User not found.");
        }

        req.user = user;
        return next();
      } catch (error) {
        return _res.error(401, res, "Unauthenticated - Invalid token.");
      }
    }
  } catch (error) {
    next(error);
  }
};
