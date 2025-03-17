import { Router } from "express";
import { getFriends, update } from "../controllers/user";

const router = Router();

router.put("/update", update);
router.get("/friends", getFriends);

export default router;
