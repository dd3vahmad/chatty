import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI as string);
    console.log(`DB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`DB connected: ${error}`);
  }
};
