import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  username: string;
  fullname: string;
  email: string;
  password: string;
  pic: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateProfilePicture(newPicUrl: string): Promise<void>;
  getPublicProfile(): Partial<IUser>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    pic: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Check if username or email already exists
userSchema.pre("save", async function (next) {
  const user = await User.findOne({
    $or: [{ username: this.username }, { email: this.email }],
  });
  if (user) {
    const error = new Error("Username or email already exists");
    next(error);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update profile picture
userSchema.methods.updateProfilePicture = async function (
  newPicUrl: string
): Promise<void> {
  this.pic = newPicUrl;
  await this.save();
};

// Method to get public profile (without password)
userSchema.methods.getPublicProfile = function (): Partial<IUser> {
  return {
    username: this.username,
    fullname: this.fullname,
    email: this.email,
    pic: this.pic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default User;
