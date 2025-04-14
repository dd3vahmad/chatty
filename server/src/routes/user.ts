import { Router } from "express";
import {
  updateProfile,
  getUserProfile,
  getAllUserProfiles
} from "../controllers/user";

const router = Router();

router.get("/", getUserProfile);
router.get("/all", getAllUserProfiles);
router.put("/update", updateProfile);

export default router;
