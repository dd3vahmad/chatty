import { Router } from "express";
import { validateCreateChatRoom } from "../validations/chatroom";
import { createChatRoom, getChatRooms } from "../controllers/chatroom";
import { getChatRoomMessages } from "../controllers/message";

const router = Router();

router.post('/', validateCreateChatRoom, createChatRoom);
router.get("/", getChatRooms);
router.get("/messages", getChatRoomMessages);

export default router;
