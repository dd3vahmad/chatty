import { NextFunction, Response } from "express";
import User from "../models/user";
import { _res } from "../lib/utils";
import { IRequestWithUser } from "../types/interfaces";
import ChatRoom from "../models/chatroom";

export const getChats = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const chats = await ChatRoom.findByMember(req.user.id as string);

    _res.success(200, res, "Chats fetched successfully", chats.map(chat => chat.getPublicProfile()));
  } catch (error) {
    next(error);
  }
}

export const updateProfile = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, bio, email, pic } = req.body;

    if (!username && !bio && !email && !pic) {
      _res.error(400, res, "No valid profile fields provided for update");
      return
    }

    if (!username || !email) {
      _res.error(400, res, "Email and username are required fields");
      return
    }

    const updateData: { [key: string]: any } = {};

    updateData.username = username.toLowerCase().trim();
    updateData.bio = !bio ? "" : bio;
    updateData.email = email.toLowerCase().trim();

    if (typeof pic !== 'string') {
      _res.error(400, res, "Invalid profile picture format");
      return
    }

    if (!(pic.startsWith('data:image/') || pic.startsWith('http'))) {
      _res.error(400, res, "Profile picture must be a valid image URL or data URL");
      return
    }

    updateData.pic = pic;

    if (Object.keys(updateData).length === 0) {
      _res.error(400, res, "No valid profile fields provided for update");
      return
    }

    const updatedProfile = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      _res.error(404, res, "User not found");
      return
    }

    _res.success(200, res, "User profile updated successfully", updatedProfile.getPublicProfile());
  } catch (error) {
    if (error.name === 'ValidationError') {
      _res.error(400, res, error.message);
      return
    }
    if (error.code === 11000) {
      _res.error(409, res, "Username or email is already in use"); // Handle duplicate key errors
      return
    }
    next(error);
  }
};
