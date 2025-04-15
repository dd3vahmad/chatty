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

friendSchema.statics.getCustomNames = async function(userId, friendIds) {
  if (!userId || !friendIds || friendIds.length === 0) {
    return {};
  }

  // Convert all IDs to strings for consistent comparison
  const friendIdStrings = friendIds.map((id: Schema.Types.ObjectId) => id.toString());

  // Find all friend entries for this user with these friends
  const friendEntries = await this.find({
    createdBy: userId,
    userId: { $in: friendIdStrings }
  }).lean();

  // Create a map of friendId -> custom name
  const customNameMap = {};
  friendEntries.forEach((entry: IFriend) => {
    if (entry.name) {
      customNameMap[entry.userId.toString()] = entry.name;
    }
  });

  return customNameMap;
};

export interface FriendModel extends Model<IFriend> {
  getCustomNames(userId: string, friendIds: string[]): Promise<Record<string, string>>;
}

const Friend = mongoose.model<IFriend, FriendModel>("Friend", friendSchema);
export default Friend;
