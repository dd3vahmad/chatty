import mongoose, { Model } from "mongoose";
import User, { IUser } from "./user";

export interface IMessage extends Document {
  getReceiver(): IUser;
  getSender(): IUser;
}

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    media: {
      type: String,
    },
  },
  { timestamps: true }
);

// Method to get the receiver's public profile.
messageSchema.methods.getReceiver = async function () {
  return (await User.findById(this.receiverId)).getPublicProfile();
};

// Method to get the sender's public profile.
messageSchema.methods.getSender = async function () {
  return (await User.findById(this.senderId)).getPublicProfile();
};

const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);

export default Message;
