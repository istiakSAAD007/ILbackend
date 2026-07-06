import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  createCV,
  getMyCVs,
  getPositionCVs,
  toggleLike,
  deleteCV,
} from "../controllers/cvController.js";

const router = Router();
router.use(verifyToken);

router.get("/my-cvs", getMyCVs);
router.post("/position/:positionId", createCV);
router.delete("/:id", deleteCV);

router.get('/position/:positionId', authorizeRoles("RECRUITER"), getPositionCVs);
router.post('/:cvId/like', authorizeRoles("RECRUITER"), toggleLike);

export default router;