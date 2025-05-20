import express from "express";
import { 
    registerUser, loginUser, getCurrentUser, createNewEdRoom, 
    getAllEdRooms, checkEditorAccess, generateEdInvLink, joinEdRoomViaInv, leaveEdRoom 
} from '../controllers/authController.js';
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
router.post('/rooms/:roomId/invite', verifyToken, generateEdInvLink);
router.post('/invite/:inviteId', verifyToken, joinEdRoomViaInv);
router.post('/rooms/:roomId/leave', verifyToken, leaveEdRoom);

export default router;
