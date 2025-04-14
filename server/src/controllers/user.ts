import { NextFunction, Response } from "express";
import User from "../models/user";
import { _res } from "../lib/utils";
import { IRequestWithUser } from "../types/interfaces";
import Friend from "../models/friend";
import { Types } from "mongoose";

/**
* Get a user profile
*
**/
export const getUserProfile = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const validUser = await User.findById(req.params.id || req.user.id);

    if (!validUser) {
      _res.error(400, res, "User doesn't seem to exist.");
      return
    }

    const userProfile = await validUser.getPublicProfile(req.user.id);

    _res.success(200, res, "User profile fetched successfully", userProfile);
  } catch (error) {
    next(error)
  }
}

/**
* Get all user profiles
*
**/
export const getAllUserProfiles = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchQuery = (req.query.name as string)?.trim();
    const loggedInUserId = req.user.id;

    if (!searchQuery) {
      _res.error(400, res, "Search query is required.");
      return
    }

    // 1. Search users by fuzzy username 
    const users = await User.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: searchQuery,
            path: ["username"],
            fuzzy: { maxEdits: 2 }
          }
        }
      },
      {
        $project: {
          _id: 1,
          username: 1,
          bio: 1,
          email: 1,
          pic: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    // 2. Get friends by fuzzy custom name match
    const friends = await Friend.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: searchQuery,
            path: "name",
            fuzzy: { maxEdits: 2 }
          }
        }
      },
      {
        $match: { createdBy: new Types.ObjectId(loggedInUserId) }
      }
    ]);

    // 3. Fetch users from friend references
    const friendUserIds = friends.map(friend => friend.userId);
    const usersFromFriends = await User.find({ _id: { $in: friendUserIds } })
      .select("username bio email pic createdAt updatedAt")
      .lean();

    // 4. Merge all users into one set
    const allUsersMap = new Map();
    [...users, ...usersFromFriends].forEach(user => {
      allUsersMap.set(user._id.toString(), user);
    });
    const allUsers = Array.from(allUsersMap.values());

    // 5. Get custom names for all matched users
    const customNameMap = await Friend.getCustomNames(loggedInUserId, allUsers.map(u => u._id));

    // 6. Assemble final public profiles
    const userProfiles = allUsers.map(user => ({
      id: user._id,
      username: user.username,
      bio: user.bio,
      email: user.email,
      pic: user.pic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      name: customNameMap[user._id.toString()] || undefined
    }));

    _res.success(200, res, "User profile(s) fetched successfully", userProfiles);
  } catch (error) {
    next(error);
  }
};

/**
* Update user profile
*
**/
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
