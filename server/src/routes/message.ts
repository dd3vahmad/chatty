import { Router } from "express";
import { getMessages } from "../controllers/message";

const router = Router();

router.get("/messages/:id", getMessages);

export default router;
