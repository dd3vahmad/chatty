import { NextFunction, Response, Request } from "express";
import Message from "../models/message";
import ChatRoom from "../models/chatroom";
import { _res, uploadMedia } from "../lib/utils";
import { IRequestWithUser } from "../types/interfaces";
import Joi from "joi";
import mongoose from "mongoose";
import { IFriend } from "../models/friend";

// Message validation schema
export const messageSchema = Joi.object({
  text: Joi.string()
    .trim()
    .allow(null, '')
    .messages({
      'string.base': 'Text must be a string'
    }),
  media: Joi.string()
    .allow(null, '')
    .messages({
      'string.base': 'Media must be a string'
    }),
  roomId: Joi.string()
    .required()
    .messages({
      'any.required': 'Room ID is required'
    }),
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  isGuest: Joi.boolean()
    .default(false)
}).or('text', 'media').messages({
  'object.missing': 'Either text or media is required'
});

// Get messages for a specific chat room
export const getChatRoomMessages = async (
  req: IRequestWithUser | Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if chat room exists
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      _res.error(404, res, "Chat room not found");
      return;
    }

    // Verify user has access to the room
    let userHasAccess = false;
    let requestingUserId = null;

    // Check if user is registered
    if ('user' in req && req.user) {
      userHasAccess = chatRoom.hasMember(req.user.id);
      requestingUserId = req.user.id;
    } else if (req.query.guestId) {
      // Check if guest has access
      userHasAccess = chatRoom.hasGuest(req.query.guestId as string);
    }

    if (!userHasAccess) {
      _res.error(403, res, "You do not have access to this chat room");
      return;
    }

    // Get total message count
    const totalMessages = await Message.countDocuments({ roomId });

    // Get messages with custom names for friends
    const messageQuery = { roomId };
    const messagesRaw = await Message.find(messageQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Apply custom friend names if user is registered
    let messages = messagesRaw;
    if (requestingUserId) {
      messages = await Message.findWithCustomNames(messageQuery, requestingUserId) as any;

      // Apply sorting and pagination manually since we're using a custom method
      messages = messages
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit);
    }

    _res.success(200, res, "Messages fetched successfully", {
      messages,
      pagination: {
        total: totalMessages,
        page,
        limit,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Function to send message to a chatroom
export const sendMessage = async (
  req: IRequestWithUser | Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      _res.error(400, res, error.message);
      return;
    }

    const { text, media, roomId, userId } = value;

    // Check if room exists
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      _res.error(404, res, "Chat room not found");
      return;
    }

    // Verify user has access to the room
    let userHasAccess = false;
    let userInfo = null;

    // For registered users
    if ('user' in req && req.user) {
      userHasAccess = chatRoom.hasMember(req.user.id);
      if (userHasAccess) {
        userInfo = {
          _id: req.user.id,
          username: req.user.username,
          pic: req.user.pic,
          isGuest: false
        };
      }
    } else {
      // For guest users
      userHasAccess = chatRoom.hasGuest(userId);
      if (userHasAccess) {
        const guest = chatRoom.guests.find(g => g._id === userId);
        if (guest) {
          userInfo = {
            _id: guest._id,
            username: guest.username,
            pic: guest.pic,
            isGuest: true
          };
        }
      }
    }

    if (!userHasAccess) {
      _res.error(403, res, "You do not have access to this chat room");
      return;
    }

    // Process media if provided
    let mediaUrl: string;
    if (media) {
      const { secure_url } = await uploadMedia(media);
      mediaUrl = secure_url;
    }

    // Create new message
    const newMessage = new Message({
      text,
      media: mediaUrl,
      senderId: userInfo._id,
      senderName: userInfo.username,
      senderPic: userInfo.pic,
      isGuest: userInfo.isGuest,
      roomId
    });

    await newMessage.save();

    // Get socket.io instance and emit message
    const io = req.app.get('io');
    if (io) {
      // Get all users in the room to check for custom friend names
      const roomMembers = [...chatRoom.members.map(id => id.toString())];

      // For each member, check if they have a custom name for the sender
      if (!userInfo.isGuest) {
        const Friend = mongoose.model('Friend');
        const customNamePromises = roomMembers.map(async memberId => {
          if (memberId === userInfo._id.toString()) return null;

          const friendEntry = await Friend.findOne({
            createdBy: memberId,
            userId: userInfo._id
          }).lean();

          return friendEntry ? { memberId, customName: (friendEntry as any as IFriend).name } : null;
        });

        const customNames = (await Promise.all(customNamePromises))
          .filter(entry => entry !== null)
          .reduce((acc, entry) => {
            acc[entry.memberId] = entry.customName;
            return acc;
          }, {});

        // Emit personalized messages to each user
        roomMembers.forEach(memberId => {
          const personalizedMessage = { ...newMessage.toObject() };
          if (customNames[memberId]) {
            personalizedMessage.senderName = customNames[memberId];
          }

          io.to(`user:${memberId}`).emit('message:new', {
            message: {
              ...personalizedMessage,
              sender: {
                ...userInfo,
                username: customNames[memberId] || userInfo.username
              }
            }
          });
        });

        // Also emit to room for guests and others
        io.to(roomId).emit('message:new', {
          message: {
            ...newMessage.toObject(),
            sender: userInfo
          }
        });
      } else {
        // For guest users, just emit to the room
        io.to(roomId).emit('message:new', {
          message: {
            ...newMessage.toObject(),
            sender: userInfo
          }
        });
      }
    }

    _res.success(201, res, "Message sent successfully", newMessage);
  } catch (error) {
    next(error);
  }
};
