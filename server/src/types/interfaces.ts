import { IUser } from "../models/user";
import { Request } from "express";

export interface IRequestWithUser extends Request {
  user: IUser
}
