import { Router } from "express";
import { validateCreateChatRoom } from "../validations/chatroom";
import { createChatRoom } from "../controllers/chatroom";

const router = Router();

router.post('/', validateCreateChatRoom, createChatRoom);

export default router;
