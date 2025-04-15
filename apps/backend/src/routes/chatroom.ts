import { Router } from "express";
import { validateCreateChatRoom } from "../validations/chatroom";
import { createChatRoom, getChatRoom, getChatRoomMembers, getChatRooms } from "../controllers/chatroom";

const router = Router();

router.post('/', validateCreateChatRoom, createChatRoom);
router.get("/", getChatRooms);
router.get("/:id", getChatRoom);
router.get("/members/:roomId", getChatRoomMembers);

export default router;
