import { WorkOS } from "@workos-inc/node";
import { config } from "dotenv";
import User from "../models/user";
import bcrypt from "bcryptjs";
import crypto from "crypto";

config();

export const handleWorkOSAuth = async (workosUser: any) => {
  try {
    let user = await User.findOne({ workosId: workosUser.id });

    if (!user) {
      user = await User.findOne({ email: workosUser.email });

      if (user) {
        user.workosId = workosUser.id;
        if (workosUser.profilePictureUrl && !user.cloudinaryId) {
          user.pic = workosUser.profilePictureUrl;
        }
      } else {
        user = new User({
          username: workosUser.email.split("@")[0], // Default username from email
          email: workosUser.email,
          workosId: workosUser.id,
          password: await bcrypt.hash(
            crypto.randomBytes(20).toString("hex"),
            10
          ), // Random secure password
          pic: workosUser.profilePictureUrl || undefined,
          firstName: workosUser.firstName,
          lastName: workosUser.lastName,
          emailVerified: workosUser.emailVerified,
        });
      }
    } else {
      // Update existing WorkOS user with latest info
      user.email = workosUser.email;
      user.firstName = workosUser.firstName;
      user.lastName = workosUser.lastName;
      user.emailVerified = workosUser.emailVerified;

      // Only update profile picture if user hasn't uploaded a custom one
      if (workosUser.profilePictureUrl && !user.cloudinaryId) {
        user.pic = workosUser.profilePictureUrl;
      }
    }

    await user.save();
    return user;
  } catch (error) {
    console.error("Error handling WorkOS auth:", error);
    throw error;
  }
};

export const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const getSession = async (cookie: string) => {
  const session = workos.userManagement.loadSealedSession({
    sessionData: cookie,
    cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
  });

  return await session.authenticate();
};

export const isAuthenticated = async (cookie: string) => {
  const result = await getSession(cookie);
  return result.authenticated;
};

export const getUser = async (cookie: string) => {
  const result = await getSession(cookie);

  if (result.authenticated) {
    return result.user;
  } else {
    return null;
  }
};
