import { Router } from "express";
import {
  createPosition,
  getAllPositions,
  updatePosition,
  deletePosition,
  duplicatePosition,
} from "../controllers/positionController.js";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", verifyToken, getAllPositions);
router.post("/", verifyToken, authorizeRoles("RECRUITER"), createPosition);
router.put("/:id", verifyToken, authorizeRoles("RECRUITER"), updatePosition);
router.delete("/:id", verifyToken, authorizeRoles("RECRUITER"), deletePosition);
router.post(
  "/:id/duplicate",
  verifyToken,
  authorizeRoles("RECRUITER"),
  duplicatePosition,
);

export default router;
