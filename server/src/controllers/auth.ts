import { Request, Response } from "express";
import { _res } from "../lib/utils";
import User from "../models/user";

export const signup = async (req: Request, res: Response) => {
  const { email, password, fullname, username } = req.body;

  try {
    const user = await User.create({ email, password, fullname, username });

    const token = user.generateAuthToken();

    res.cookie("x-auth-token", token, {
      httpOnly: true, // mitigates XSS attacks
      sameSite: "strict", // mitigates CSRF attacks
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch (error: any) {
    _res.error(500, res, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  // try
};
