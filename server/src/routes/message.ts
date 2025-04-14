import { Router } from "express";
import { getChatRoomMessages, sendMessage } from "../controllers/message";

const router = Router();

router.get("/:roomId", getChatRoomMessages);
router.post("/:id", sendMessage);

export default router;
