// NOTE: This file was originally in utilityFuncs.js but it uses code like jwt that should only exist on the backend. (Can't mix it with frontend stuff).

// [ACCOUNT MANAGEMENT-RELATED] The two imports below are for creating a middleware that authenticates and extracts user from Token:
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

import { saveEdRoomDoc } from "../backend/controllers/authController.js";
//import { saveRoomDoc } from "./api.js"; <-- EDIT: For deployment reasons, I should keep backend and frontend separate (api.js is frontend).

// [ACCOUNT MANAGEMENT-RELATED] MIDDLEWARE THAT AUTHENTICATES AND EXTRACTS USER FROM TOKEN:
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // If authHeader doesn't begin with Bearer, there's no Token referring to current user saved (and so, no current user):
    if(!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.'})
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decodedID = jwt.verify(token, JWT_SECRET);
        req.user = decodedID;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token'});
    }
};

// Moving this function from App.jsx over to here since I want to invoke it in socketIOServer.js now...
export const saveRoomData = async(roomId, docData, token) => {
    if(token) {
        try {
            //await saveRoomDoc(roomId, docData, token);
            await saveEdRoomDoc({ roomId, docData, token });
        } catch(err) {
            console.error(`ERROR: Failed to save Editor document data for Room ID:(${roomId}) to the PostgreSQL backend.`);
        }
    }
};
