import { NextFunction, Response } from "express";
import { IRequestWithUser } from "../types/interfaces";
import { _res } from "../lib/utils";
import ChatRoom from "../models/chatroom";
import {
  chatRoomParamSchema,
  joinChatRoomSchema,
  memberActionSchema,
  updateChatRoomSchema
} from "../validations/chatroom";

/**
* Create a new chat room (direct message or group chat)
*
**/
export const createChatRoom = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatRoomData = req.body;

    if (!chatRoomData.members.includes(req.user.id)) {
      chatRoomData.members.push(req.user.id);
    }

    if (chatRoomData.name) {
      // It's a group chat
      if (!chatRoomData.admins || chatRoomData.admins.length === 0) {
        chatRoomData.admins = [req.user.id];
      } else if (!chatRoomData.admins.includes(req.user.id)) {
        chatRoomData.admins.push(req.user.id);
      }
    } else {
      chatRoomData.limit = 2;
      chatRoomData.admins = [req.user.id];
      chatRoomData.isTemporary = true;
    }

    chatRoomData.createdBy = req.user.id;

    const newChatRoom = await ChatRoom.create(chatRoomData);

    _res.success(201, res, "Chat room created successfully", newChatRoom.getPublicProfile());
  } catch (error) {
    if (error.name === 'ValidationError') {
      _res.error(400, res, error.message);
      return
    }
    next(error);
  }
};

/** 
* Update chat room details
*
**/
export const updateChatRoom = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatRoomId } = req.params;

    const paramValidation = chatRoomParamSchema.validate({ chatRoomId });
    if (paramValidation.error) {
      return _res.error(400, res, paramValidation.error.message);
    }

    const { error, value } = updateChatRoomSchema.validate(req.body);
    if (error) {
      _res.error(400, res, error.message);
      return
    }

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      _res.error(404, res, "Chat room not found");
      return
    }

    if (!chatRoom.hasAdmin(req.user.id)) {
      _res.error(403, res, "Only admins can update chat room details");
      return
    }

    const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      value,
      { new: true, runValidators: true }
    );

    _res.success(200, res, "Chat room updated successfully", updatedChatRoom.getPublicProfile());
  } catch (error) {
    if (error.name === 'ValidationError') {
      return _res.error(400, res, error.message);
    }
    next(error);
  }
};

/**
* Add member to chat room
*
**/
export const addMember = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = memberActionSchema.validate(req.body);
    if (error) {
      return _res.error(400, res, error.message);
    }

    const { userId, chatRoomId } = value;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      _res.error(404, res, "Chat room not found");
      return
    }

    if (!chatRoom.hasAdmin(req.user.id)) {
      _res.error(403, res, "Only admins can add members");
      return
    }

    if (chatRoom.members.length >= chatRoom.limit) {
      _res.error(400, res, "Member limit reached for this chat room");
      return
    }

    if (chatRoom.hasMember(userId)) {
      _res.error(400, res, "User is already a member of this chat room");
      return
    }

    chatRoom.members.push(userId);
    await chatRoom.save();

    _res.success(200, res, "Member added successfully", chatRoom.getPublicProfile());
  } catch (error) {
    next(error);
  }
};

/**
* Join chat room with password (if required)
*
**/
export const joinChatRoom = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error, value } = joinChatRoomSchema.validate(req.body);
    if (error) {
      _res.error(400, res, error.message);
      return
    }

    const { chatRoomId, password } = value;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      _res.error(404, res, "Chat room not found");
      return
    }

    if (chatRoom.members.length >= chatRoom.limit) {
      _res.error(400, res, "Member limit reached for this chat room");
      return
    }

    if (chatRoom.hasMember(req.user.id)) {
      _res.error(400, res, "You are already a member of this chat room");
      return
    }

    if (chatRoom.password) {
      if (!password) {
        _res.error(400, res, "Password is required to join this chat room");
        return
      }

      const isPasswordValid = await chatRoom.comparePassword(password);
      if (!isPasswordValid) {
        _res.error(401, res, "Invalid password");
        return
      }
    }

    chatRoom.members.push(req.user.id);
    await chatRoom.save();

    _res.success(200, res, "Joined chat room successfully", chatRoom.getPublicProfile());
  } catch (error) {
    next(error);
  }
};
