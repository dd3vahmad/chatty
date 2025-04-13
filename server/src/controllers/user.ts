import { NextFunction, Request, Response } from "express";
import User from "../models/user";
import { _res } from "../lib/utils";
import { IRequestWithUser } from "../types/interfaces";
import ChatRoom from "../models/chatroom";

export const getFriends = async (
  req: IRequestWithUser,
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

export const getChats = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const chats = await ChatRoom.findByMember(req.user._id as string);

    _res.success(200, res, "Chats fetched successfully", chats.map(chat => chat.getPublicProfile()));
  } catch (error) {
    next(error)
  }
}

export const update = (req: Request, res: Response, next: NextFunction) => {
  try {
    //
  } catch (error) {
    next;
  }
};
