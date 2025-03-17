import { Router } from "express";
import { update } from "../controllers/user";

const router = Router();

router.put("/update", update);

export default router;
