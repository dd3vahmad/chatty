import mongoose, { Schema } from "mongoose";

export interface IFriend extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const friendSchema = new Schema<IFriend>(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true
    },

  },
  { timestamps: true }
)
