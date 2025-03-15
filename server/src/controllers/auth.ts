import { Request, Response } from "express";
import { _res } from "../lib/utils";
import User from "../models/user";

export const signup = async (req: Request, res: Response) => {
  const { email, password, fullname, username } = req.body;

  try {
    const user = await User.create({ email, password, fullname, username });

    _res.success(
      201,
      res,
      "User created successfully",
      user.getPublicProfile()
    );
  } catch (error: any) {
    _res.error(500, res, error.message);
  }
};
