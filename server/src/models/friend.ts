import mongoose, { Model, Schema } from "mongoose";

export interface IFriend extends Document {
  name: string;
  userId: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
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

const Friend: Model<IFriend> = mongoose.model<IFriend>("Friend", friendSchema);

export default Friend;
