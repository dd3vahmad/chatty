import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMessage extends Document {
  text?: string;
  media?: string;
  senderId: string; // Can be ObjectId or guest ID string
  senderName: string;
  senderPic?: string;
  isGuest: boolean;
  roomId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  readBy: string[]; // Can be ObjectId or guest ID string
}

const messageSchema = new Schema<IMessage>(
  {
    text: {
      type: String,
      trim: true
    },
    media: {
      type: String
    },
    senderId: {
      type: Schema.Types.Mixed, // Can be ObjectId or String
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderPic: {
      type: String
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true
    },
    readBy: [{
      type: Schema.Types.Mixed // Can be ObjectId or String
    }]
  },
  { timestamps: true }
);

// Create compound index for efficient queries
messageSchema.index({ roomId: 1, createdAt: -1 });

// Method to fetch friend data and add custom name info
messageSchema.statics.findWithCustomNames = async function(this: IMessageModel, criteria, requestingUserId) {
  // First get the raw messages
  const messages = await this.find(criteria).lean();

  if (!requestingUserId || messages.length === 0) {
    return messages;
  }

  try {
    // Get all unique sender IDs that are not guests
    const senderIds = [...new Set(
      messages
        .filter((msg: IMessage) => !msg.isGuest && mongoose.Types.ObjectId.isValid(msg.senderId))
        .map((msg: IMessage) => msg.senderId.toString())
    )];

    if (senderIds.length === 0) {
      return messages;
    }

    // Fetch all friend entries for the requesting user with these senders
    const Friend = mongoose.model('Friend');
    const friendEntries = await Friend.find({
      createdBy: requestingUserId,
      userId: { $in: senderIds }
    }).lean();

    // Create a map of userId -> custom name
    const customNameMap = {};
    friendEntries.forEach(entry => {
      if (entry.name) {
        customNameMap[entry.userId.toString()] = entry.name;
      }
    });

    // Update messages with custom names where applicable
    return messages.map((message: IMessage) => {
      const senderId = message.senderId.toString();
      if (customNameMap[senderId]) {
        return {
          ...message,
          senderName: customNameMap[senderId],
        };
      }
      return message;
    });
  } catch (error) {
    console.error('Error fetching friend data:', error);
    return messages;
  }
};

// Helper method to get a single message with custom names
messageSchema.statics.findOneWithCustomName = async function(this: IMessageModel, criteria, requestingUserId) {
  const messages = await this.findWithCustomNames(criteria, requestingUserId);
  return messages.length > 0 ? messages[0] : null;
};

export interface IMessageModel extends Model<IMessage> {
  findWithCustomNames(criteria: any, requestingUserId?: string): Promise<IMessage[]>;
  findOneWithCustomName(criteria: any, requestingUserId?: string): Promise<IMessage | null>;
}

const Message: IMessageModel = mongoose.model<IMessage, IMessageModel>("Message", messageSchema);
export default Message;
