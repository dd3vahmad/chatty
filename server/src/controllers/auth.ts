import { NextFunction, Request, Response } from "express";
import { _res } from "../lib/utils";
import User, { IUser } from "../models/user";

const attachJWT = (user: IUser, res: Response) => {
  const token = user.generateAuthToken();

  res.cookie("x-auth-token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // mitigates XSS attacks
    sameSite: "strict", // mitigates CSRF attacks
    secure: process.env.NODE_ENV !== "development" ? true : false,
  });
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, username } = req.body;

  try {
    const existingUsername = await User.findOne({ username });
    const existingUserEmail = await User.findOne({ email });

    if (existingUsername) {
      _res.error(400, res, "Username is already in use");
      return
    }
    if (existingUserEmail) {
      _res.error(400, res, "Email has already been used");
      return
    }
    const user = await User.create({ email, password, username });

    attachJWT(user, res);

    _res.success(201, res, "Registration successful", await user.getPublicProfile());
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
    const { identifier, password } = req.body; // identifier => email/username

    const validUser = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!validUser) {
      _res.error(400, res, "Invalid credentials");
      return;
    }

    const validPassword = validUser.comparePassword(password);

    if (!validPassword) {
      _res.error(400, res, "Invalid credentials");
      return;
    }

    attachJWT(validUser, res);

    _res.success(200, res, "Signin successful", await validUser.getPublicProfile());
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
    void req
    _res.success(200, res, "Signout successful");
  } catch (error) {
    next(error);
  }
};
