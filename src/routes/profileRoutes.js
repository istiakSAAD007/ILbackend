import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  getMyProfile,
  updateProfile,
  deleteAttributeValue,
  upsertAttributeValue,
} from "../controllers/profileController.js";

const router = Router();

router.use(verifyToken);

router.get("/me", getMyProfile);
router.put("/me", updateProfile);
router.post("/attributes", upsertAttributeValue);
router.delete("/attributes/:attributeId", deleteAttributeValue);

export default router;
