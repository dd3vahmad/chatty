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
    const chats = await ChatRoom.findByMember(req.user._id as string);

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
      return _res.error(400, res, "No valid profile fields provided for update");
    }

    if (!username || !email) {
      return _res.error(400, res, "Email and username are required fields")
    }

    const updateData: { [key: string]: any } = {};

    updateData.username = username.toLowerCase().trim();
    updateData.bio = !bio ? "" : bio;
    updateData.email = email.toLowerCase().trim();

    if (typeof pic !== 'string') {
      return _res.error(400, res, "Invalid profile picture format");
    }

    if (!(pic.startsWith('data:image/') || pic.startsWith('http'))) {
      return _res.error(400, res, "Profile picture must be a valid image URL or data URL");
    }

    updateData.pic = pic;

    if (Object.keys(updateData).length === 0) {
      return _res.error(400, res, "No valid profile fields provided for update");
    }

    const updatedProfile = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return _res.error(404, res, "User not found");
    }

    _res.success(200, res, "User profile updated successfully", updatedProfile.getPublicProfile());
  } catch (error) {
    if (error.name === 'ValidationError') {
      return _res.error(400, res, error.message);
    }
    if (error.code === 11000) {
      // Handle duplicate key errors
      return _res.error(409, res, "Username or email is already in use");
    }
    next(error);
  }
};
