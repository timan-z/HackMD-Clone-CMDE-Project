// Same as PrivateRoute.jsx but this is more a more ancillary purpose -- for remapping when the user inputs unintelligible URLs...
// (Where it's different if the user is logged in or not: Logged in = Dashboard, Logged Out = Login).

import { Navigate } from "react-router-dom";

const PrivateRouteMisc = ({children}) => {
    const token = localStorage.getItem("token");

    if(token) {
        return <Navigate to="/dashboard" replace/>;
    }
    return <Navigate to="/login" replace/>;
}

export default PrivateRouteMisc;
