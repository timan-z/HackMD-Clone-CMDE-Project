// Adding this to make sure that the user can't access any non /login and /register pages unless they are logged in 
// (can't access /dashboard or /editor basically -- there's nothing else, really).

import { Navigate } from "react-router-dom";

const PrivateRoute = ({children}) => {
    const token = localStorage.getItem("token");

    // If no token, the user is not logged in -- there's no cached data about current user:
    if(!token) {
        
        console.log("DEBUG: NUH UH BUSTER -- YOU NEED TO LOG IN FIRST.");

        return <Navigate to="/login" replace/>;
    }
    // If token exists, render the children:
    return children;
}

export default PrivateRoute;
