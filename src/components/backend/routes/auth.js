import express from "express";
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

// USER-RELATED:
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/me', getCurrentUser);
// MULTI-USER SESSION MANAGEMENT-RELATED:

export default router;