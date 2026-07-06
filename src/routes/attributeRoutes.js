import { Router } from "express";

import {
  getAllAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute
} from "../controllers/attributeController.js";

import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", verifyToken, getAllAttributes);
router.post('/', verifyToken, authorizeRoles("RECRUITER"), createAttribute);
router.put('/:id', verifyToken, authorizeRoles("RECRUITER"), updateAttribute);
router.delete('/:id', verifyToken, authorizeRoles("RECRUITER"), deleteAttribute);

export default router;