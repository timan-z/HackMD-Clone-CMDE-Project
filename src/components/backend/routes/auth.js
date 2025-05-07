import express from "express";
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/me', getCurrentUser);

export default router;