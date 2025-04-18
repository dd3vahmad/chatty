import { Router } from "express";
import { getCurrentUser, signin, signout, signup } from "../controllers/auth";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.get("/me", getCurrentUser);

export default router;
