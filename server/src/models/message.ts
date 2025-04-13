import mongoose, { Model, Schema } from "mongoose";
import User, { IUser } from "./user";

export interface IMessage extends Document {
  getReceiver(): IUser;
  getSender(): IUser;
}

const messageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    text: {
      type: String,
    },
    media: {
      type: String,
    },
    viewers: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

// Method to get the sender's public profile.
messageSchema.methods.getSender = async function() {
  return (await User.findById(this.senderId)).getPublicProfile();
};

const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);

export default Message;
