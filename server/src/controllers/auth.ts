import { NextFunction, Request, Response } from "express";
import { _res } from "../lib/utils";
import User from "../models/user";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, fullname, username } = req.body;

  try {
    const user = await User.create({ email, password, fullname, username });

    const token = user.generateAuthToken();

    res.cookie("x-auth-token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // mitigates XSS attacks
      sameSite: "strict", // mitigates CSRF attacks
      secure: process.env.NODE_ENV !== "development" ? true : false,
    });

    _res.success(
      201,
      res,
      "User registered successfully",
      user.getPublicProfile()
    );
  } catch (error: any) {
    next(error);
  }
};

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //
    _res.success(200, res, "Signin successful");
  } catch (error) {
    next(error);
  }
};

export const signout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("x-auth-token");
    _res.success(200, res, "Signout successful");
  } catch (error) {
    next(error);
  }
};
