import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { _res } from '../lib/utils';

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (value: string) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Custom Joi extension for MongoDB ObjectId validation
const objectIdValidator = Joi.extend((joi) => {
  return {
    type: 'objectId',
    base: joi.string(),
    messages: {
      'objectId.invalid': '{{#label}} must be a valid MongoDB ObjectId'
    },
    validate(value, helpers) {
      if (!isValidObjectId(value)) {
        return { value, errors: helpers.error('objectId.invalid') };
      }
      return { value };
    }
  };
});

// Basic CreateChatRoom validation schema (for creating 1-on-1 chats)
export const createDirectChatRoomSchema = Joi.object({
  members: Joi.array()
    .items(objectIdValidator.objectId())
    .min(1)
    .max(2)
    .required()
    .messages({
      'array.min': 'At least one member is required',
      'array.max': 'Direct chat can only have two members'
    }),
  createdBy: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'Creator ID is required'
    })
});

// Group chat creation validation schema
export const createGroupChatRoomSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.min': 'Group name must be at least 3 characters long',
      'string.max': 'Group name cannot exceed 50 characters',
      'any.required': 'Group name is required'
    }),
  limit: Joi.number()
    .integer()
    .min(2)
    .default(10)
    .messages({
      'number.base': 'Member limit must be a number',
      'number.min': 'Member limit must be at least 2'
    }),
  members: Joi.array()
    .items(objectIdValidator.objectId())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one member is required',
      'any.required': 'Members array is required'
    }),
  admins: Joi.array()
    .items(objectIdValidator.objectId())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one admin is required',
      'any.required': 'Admins array is required'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .allow(null, '')
    .messages({
      'string.min': 'Password must be at least 6 characters long'
    }),
  pic: Joi.string()
    .uri()
    .allow(null, '')
    .pattern(/^(data:image\/|http)/)
    .messages({
      'string.pattern.base': 'Profile picture must be a valid image URL or data URL'
    }),
  isTemporary: Joi.boolean()
    .default(true),
  createdBy: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'Creator ID is required'
    })
});

// Update ChatRoom validation schema
export const updateChatRoomSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .messages({
      'string.min': 'Group name must be at least 3 characters long',
      'string.max': 'Group name cannot exceed 50 characters'
    }),
  limit: Joi.number()
    .integer()
    .min(2)
    .messages({
      'number.base': 'Member limit must be a number',
      'number.min': 'Member limit must be at least 2'
    }),
  pic: Joi.string()
    .pattern(/^(data:image\/|http)/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Profile picture must be a valid image URL or data URL'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .allow(null, '')
    .messages({
      'string.min': 'Password must be at least 6 characters long'
    }),
  isTemporary: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one field is required for update'
});

// Add/Remove members validation schema
export const memberActionSchema = Joi.object({
  userId: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  chatRoomId: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'Chat room ID is required'
    })
});

// Join with password validation schema (complete)
export const joinChatRoomSchema = Joi.object({
  chatRoomId: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'Chat room ID is required'
    }),
  password: Joi.string()
    .allow(null, ''),
  guestUsername: Joi.string()
    .min(3)
    .max(30)
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    })
});

// Validate params for fetching a specific chatroom
export const chatRoomParamSchema = Joi.object({
  chatRoomId: objectIdValidator.objectId()
    .required()
    .messages({
      'any.required': 'Chat room ID is required'
    })
});

export const validateCreateChatRoom = (req: Request, res: Response, next: NextFunction) => {
  const isGroupChat = req.body.name; // If name is provided, assume it's a group chat
  const schema = isGroupChat ? createGroupChatRoomSchema : createDirectChatRoomSchema;

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    _res.error(400, res, errorMessage);
  }

  next();
};

