// Adding this to make sure that a logged-in user can't access a /editor/:roomId
// DEBUG:+NOTE: Nevermind, I think adding this route might've been completely redundant.

import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { checkRoomAccess } from "../utility/api";

const PrivateRouteEditor = ({ children }) => {
    const token = localStorage.getItem("token");
    const { roomId } = useParams();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const data = await checkRoomAccess(roomId, token);
                setIsAuthorized(data.access);
            } catch(err) {
                console.error("Room Access Check failed: ", err);
                setIsAuthorized(false);
            }
        };
        
        if(token && roomId) {
            verifyAccess();
        } else {
            setIsAuthorized(false);
        }
    }, [roomId, token]);

    if(!token) return <Navigate to="login" replace/>;
    if(isAuthorized === null) return <h1>LOADING</h1>;
    if(!isAuthorized) return <Navigate to="/dashboard"/>
    // If all conditions are met, render the webpage:
    return children;
}

export default PrivateRouteEditor;
