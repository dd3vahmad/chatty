import { Response } from "express";
import cloudinary from "./cloudinary";

export const _res = {
  error: (sts: number, res: Response, message: string) =>
    res.status(sts).json({ failed: true, message }),
  success: (
    sts: number,
    res: Response,
    message: string,
    data?: any,
    meta?: any
  ) => res.status(sts).json({ failed: false, message, data, meta }),
};

export const uploadMedia = async (media: string) => {
  try {
    return await cloudinary.uploader.upload(media);
  } catch (error) {
    throw new Error("An error occurred while trying to send this media.");
  }
};
