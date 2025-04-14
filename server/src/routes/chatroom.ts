import { Router } from "express";
import { validateCreateChatRoom } from "../validations/chatroom";
import { createChatRoom, getChatRoom, getChatRooms } from "../controllers/chatroom";
import { getChatRoomMessages } from "../controllers/message";

const router = Router();

router.post('/', validateCreateChatRoom, createChatRoom);
router.get("/", getChatRooms);
router.get("/:id", getChatRoom);
router.get("/messages", getChatRoomMessages);

export default router;
