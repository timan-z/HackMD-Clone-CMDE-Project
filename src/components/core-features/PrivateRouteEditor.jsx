// Adding this to make sure that a logged-in user can't access a /editor/:roomId

import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkRoomAccess } from "../utility/api";

const PrivateRouteEditor = ({ children }) => {
    const token = localStorage.getItem("token");
    const { roomID } = useParams();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const data = await checkRoomAccess(roomID, token);
                setIsAuthorized(data.access);
            } catch(err) {
                console.error("DEBUG: Room Access Check failed: ", err);
                setIsAuthorized(false);
            }
        };
        
        if(token && roomID) {
            verifyAccess();
        } else {
            setIsAuthorized(false);
        }
    }, [roomID, token]);

    if(!token) return <Navigate to="login" replace/>;
    if(isAuthorized === null) return <h1>LOADING</h1>; // DEBUG: Style this afterwards so it's just a blank webpage with "LOADING" centered (with font and background colour that matches Editor scheme). <-- Add a green spinning wheel?
    if(!isAuthorized) return <Navigate to="/dashboard"/>
    // If all conditions are met, render the webpage:
    return children;
}

export default PrivateRouteEditor;
