import { Router } from "express";
import {
  updateProfile,
  getUserProfile,
  getAllUserProfiles,
  getAllFriends
} from "../controllers/user";

const router = Router();

router.get("/friends", getAllFriends);
router.get("/:id", getUserProfile);
router.get("/", getAllUserProfiles);
router.put("/", updateProfile);

export default router;
