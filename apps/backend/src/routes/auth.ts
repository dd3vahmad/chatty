import { Router } from "express";
import { signin, signout, signup, workosCallback } from "../controllers/auth";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.post("/callback", workosCallback);

export default router;
