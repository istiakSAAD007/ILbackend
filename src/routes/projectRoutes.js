import { Router } from "express";
import {
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();
router.use(verifyToken);

router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
