import { Router } from "express";
import { getChats, update } from "../controllers/user";

const router = Router();

router.put("/update", update);
router.get("/chats", getChats);

export default router;
