import { Router } from "express";
import { getMessages } from "../controllers/message";

const router = Router();

router.get("/:id", getMessages);
router.post("/:id", getMessages);

export default router;
