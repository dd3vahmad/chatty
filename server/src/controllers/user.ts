import { NextFunction, Request, Response } from "express";
import User from "../models/user";
import { _res } from "../lib/utils";

export const getFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const friends = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    );

    _res.success(200, res, "Friends fetched successfully", friends);
  } catch (error) {
    next(error);
  }
};

export const update = (req: Request, res: Response, next: NextFunction) => {
  try {
    //
  } catch (error) {
    next;
  }
};
