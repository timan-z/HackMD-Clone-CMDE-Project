import express from "express";
import { registerUser, loginUser, getCurrentUser, createNewEdRoom, getAllEdRooms, checkEditorAccess } from '../controllers/authController.js';
import { verifyToken } from '../../utility/utilityFuncsBE.js';

const router = express.Router();

// USER-RELATED:
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/me', getCurrentUser);

// MULTI-USER SESSION MANAGEMENT-RELATED:
router.post('/create-room', verifyToken, createNewEdRoom);
router.get('/rooms', verifyToken, getAllEdRooms);
router.get('/rooms/:roomId/access', verifyToken, checkEditorAccess);

export default router;