import { Router } from "express";
import {createPost, getDiscussions} from "../controllers/discussionController.js";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

router.get('/position/:positionId', verifyToken, getDiscussions);
router.post('/position/:positionId', verifyToken, createPost);

export default router;