import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  username: string;
  bio: string;
  email: string;
  password: string;
  pic: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateProfilePicture(newPicUrl: string): Promise<void>;
  getPublicProfile(): Partial<IUser>;
  generateAuthToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      required: false,
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

// Clean and Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password.trim().toLowerCase(), salt);
  next();
});

// Clean username before saving
userSchema.pre("save", function() {
  this.username = this.username.trim().toLowerCase();
});

// Method to generate auth token
userSchema.methods.generateAuthToken = function(): string {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// Method to compare passwords
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update profile picture
userSchema.methods.updateProfilePicture = async function(
  newPicUrl: string
): Promise<void> {
  this.pic = newPicUrl;
  await this.save();
};

// Method to get public profile (without password)
userSchema.methods.getPublicProfile = function(): Partial<IUser> {
  return {
    username: this.username,
    bio: this.bio,
    email: this.email,
    pic: this.pic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
