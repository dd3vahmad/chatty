import { NextFunction, Request, Response } from "express";
import Message from "../models/message";
import { _res } from "../lib/utils";

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userToChatId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: userId },
      ],
    });

    _res.success(200, res, "Messages fetched successfully", messages);
  } catch (error) {
    next(error);
  }
};
