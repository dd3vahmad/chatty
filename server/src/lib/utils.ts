import { Response } from "express";

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
