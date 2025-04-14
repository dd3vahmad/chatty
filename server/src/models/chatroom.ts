import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IChatRoom extends Document {
  name: string;
  limit: number;
  members: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  guests?: {
    _id: string;
    username: string;
    pic?: string;
    isGuest: boolean;
    joinedAt: Date;
  }[];
  password: string;
  pic: string;
  isTemporary: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateProfilePicture(newPicUrl: string): Promise<void>;
  getPublicProfile(): Partial<IChatRoom>;
  hasMember(userId: mongoose.Types.ObjectId): boolean;
  hasAdmin(userId: mongoose.Types.ObjectId): boolean;
  hasGuest(guestId: string): boolean;
}

const guestSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  pic: {
    type: String
  },
  isGuest: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatRoomSchema = new Schema<IChatRoom>(
  {
    name: {
      type: String,
    },
    limit: {
      type: Number,
      default: 2,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    guests: [guestSchema],
    password: {
      type: String,
      required: false,
    },
    pic: {
      type: String,
    },
    isTemporary: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

// Hash password before saving
chatRoomSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
chatRoomSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update profile picture
chatRoomSchema.methods.updateProfilePicture = async function(
  newPicUrl: string
): Promise<void> {
  this.pic = newPicUrl;
  await this.save();
};

// Method to get public profile (without password)
chatRoomSchema.methods.getPublicProfile = function(): Partial<IChatRoom> {
  return {
    id: this._id,
    name: this.name,
    limit: this.limit,
    members: this.members,
    admins: this.admins,
    guests: this.guests,
    pic: this.pic,
    isTemporary: this.isTemporary,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Method to check if user is a member of the chatroom
chatRoomSchema.methods.hasMember = function(userId: string): boolean {
  return this.members.some((memberId: mongoose.Types.ObjectId) =>
    memberId.equals(userId)
  );
};

// Method to check if user is a member of the chatroom
chatRoomSchema.methods.hasAdmin = function(userId: string): boolean {
  return this.admins.some((adminId: mongoose.Types.ObjectId) =>
    adminId.equals(userId)
  );
};

// Method to check if guest is a member of chatroom
chatRoomSchema.methods.hasGuest = function(guestId: string): boolean {
  return this.guests && this.guests.some((guest: any) => guest._id === guestId);
};

// Static method to get all chatrooms where user is a member
chatRoomSchema.statics.findByMember = function(userId: string) {
  return this.find({ members: userId });
};

// Static method to get all chatrooms where user is an admin
chatRoomSchema.statics.findByAdmin = function(userId: string) {
  return this.find({ admins: userId });
};

export interface IChatRoomModel extends Model<IChatRoom> {
  findByMember(userId: string): Promise<IChatRoom[]>;
  findByAdmin(userId: string): Promise<IChatRoom[]>;
}

const ChatRoom: IChatRoomModel = mongoose.model<IChatRoom, IChatRoomModel>("ChatRoom", chatRoomSchema);
export default ChatRoom;
