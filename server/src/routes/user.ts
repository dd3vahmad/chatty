import { Router } from "express";
import { getChats, updateProfile } from "../controllers/user";

const router = Router();

router.put("/update", updateProfile);
router.get("/chats", getChats);

export default router;
