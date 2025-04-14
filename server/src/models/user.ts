import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary";

const PASSWORD_MIN_LENGTH = 8;
const JWT_EXPIRATION = "7d";
const SALT_ROUNDS = 10;
const AVATAR_STYLES = ['micah', 'avataaars', 'personas', 'bottts', 'identicon'];

export interface IUser extends Document {
  username: string;
  bio: string;
  email: string;
  password: string;
  pic: string;
  cloudinaryId: string | null;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): Partial<IUser>;
  generateAuthToken(): string;
  resetPassword(newPassword: string): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minLength: [3, "Username must be at least 3 characters long"],
      maxLength: [30, "Username must be less than 30 characters long"],
    },
    bio: {
      type: String,
      default: "",
      maxLength: [250, "Bio must be less than 250 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`],
      select: false,
    },
    pic: {
      type: String,
    },
    cloudinaryId: {
      type: String,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);

/**
 * Generate a random avatar for new users
 */
userSchema.pre("save", function(next) {
  if (!this.isNew || this.pic) return next();

  try {
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const seed = this.username || this._id.toString();
    this.pic = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
  } catch (error) {
    console.error("Error generating avatar:", error);
    this.pic = `https://api.dicebear.com/7.x/identicon/svg?seed=${this._id.toString()}`;
  }
  next();
});

/**
 * Hash password before saving
 */
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password.trim(), salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Handle profile picture uploads
 */
userSchema.pre("save", async function(next) {
  if (!this.isModified("pic")) return next();

  try {
    if (this.pic?.startsWith("data:image")) {
      if (this.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(this.cloudinaryId);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      const publicId = `profiles/${this._id}_${Date.now()}`;

      const uploadResponse = await cloudinary.uploader.upload(this.pic, {
        public_id: publicId,
        folder: "profiles",
        overwrite: true,
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "limit" },
          { quality: "auto" }
        ],
      });

      this.pic = uploadResponse.secure_url;
      this.cloudinaryId = uploadResponse.public_id;
    }
    next();
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    this.pic = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${this._id.toString()}`;
    this.cloudinaryId = null;
    next();
  }
});

/**
 * Generate JWT auth token
 */
userSchema.methods.generateAuthToken = function(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Compare provided password with stored hash
 */
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const user = this.password ? this : await User.findById(this._id).select("+password");
    if (!user || !user.password) {
      throw new Error("Password not available for comparison");
    }
    return bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

/**
 * Reset user password
 */
userSchema.methods.resetPassword = async function(newPassword: string): Promise<void> {
  this.password = newPassword;
  await this.save();
};

/**
 * Get public profile (excluding sensitive information)
 */
userSchema.methods.getPublicProfile = async function(requestingUserId?: string): Promise<Partial<IUser> & { name?: string }> {
  const profile: Partial<IUser> & { name?: string } = {
    id: this._id,
    username: this.username,
    bio: this.bio,
    email: this.email,
    pic: this.pic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (requestingUserId) {
    try {
      const Friend = mongoose.model('Friend');

      const friendEntry = await Friend.findOne({
        createdBy: requestingUserId,
        userId: this._id
      });

      if (friendEntry) {
        profile.name = friendEntry.name;
      }
    } catch (error) {
      console.error('Error fetching friend data:', error);
    }
  }

  return profile;
};

// Create user model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
