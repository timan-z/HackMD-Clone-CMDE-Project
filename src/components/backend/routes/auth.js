import express from "express";
import { registerUser, loginUser, getCurrentUser, createNewEdRoom } from '../controllers/authController.js';
import { verifyToken } from '../../utility/utilityFuncs.js';

const router = express.Router();

// USER-RELATED:
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/me', getCurrentUser);

// MULTI-USER SESSION MANAGEMENT-RELATED:
router.post("/create-room", verifyToken, createNewEdRoom);

export default router;