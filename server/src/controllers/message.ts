import { NextFunction, Request, Response } from "express";
import Message from "../models/message";
import { _res, uploadMedia } from "../lib/utils";

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

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text, media } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let mediaUrl;
    if (media) {
      const { secure_url } = await uploadMedia(media);
      mediaUrl = secure_url;
    }

    const newMessage = new Message({
      text,
      media: mediaUrl,
      senderId,
      receiverId,
    });
    await newMessage.save();

    // TODO: Socket connetion.

    _res.success(200, res, "Message sent successfully");
  } catch (error) {
    next(error);
  }
};
