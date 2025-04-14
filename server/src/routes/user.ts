import { Router } from "express";
import {
  updateProfile,
  getUserProfile,
  getAllUserProfiles
} from "../controllers/user";

const router = Router();

router.get("/:id", getUserProfile);
router.get("/", getAllUserProfiles);
router.put("/update", updateProfile);

export default router;
