// NOTE: This file was originally in utilityFuncs.js but it uses code like jwt that should only exist on the backend. (Can't mix it with frontend stuff).

// [ACCOUNT MANAGEMENT-RELATED] The two imports below are for creating a middleware that authenticates and extracts user from Token:
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

import { saveEdRoomDoc } from "../controllers/authController.js";
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

/* 9/6/2025-NOTE:+DEBUG: The below checkValidEmail function was copied over from utilityFuncs.js from the /frontend folder, but I'm just going to
paste it here for now (I know that's not good practice), but I'm going to be re-organizing this project into a monorepo architecture where the
/backend and /frontend will be separate (so it's easier for the respective hosting on Railway and Netlify). Not sure if I'll be able to reference
files in /frontend if I set my "source path" (or whatever) on Railway to /backend -- so, for now, just going to have it pasted here: */
// For Login.jsx and Register.jsx:
// NOTE: Not doing anything extensive when it comes to error-checking the email (not the main point of this project, would take way too long).
export const checkValidEmail = (email) => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return EMAIL_REGEX.test(email);
};
