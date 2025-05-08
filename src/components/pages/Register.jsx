// REGISTER PAGE (will be pretty similar structurally to Login.jsx):
/* NOTE: ^ Maybe I can change the design afterwards when all the core functionality is finished. Similar to how
the Github Registration page is super fancy compared to the Login one...*/

// ^ Yeah, I'm going to base the design here off of GitHub's Registration page. So the "Sign Up" stuff will all be on the right-hand side of the webpage

import React, {useState, useEffect, useRef} from "react";
import {register} from "../utility/api.js";

function Register() {
    return(
        <div id="registerp-outermost-div">
            {/* The contents of the outermost <div> will be two primary inner <div> elements equally partitioned
            to the left and right (just like the GitHub Registration webpage as of 5/7/25). In the <div> below, there will
            be some sort of design and interactive Text advertising the site -- while, the actual Registration form will be to its right. */}
            
            {/* 1. LHS: */}
            <div id="registerp-lhs">
                SOMETHING GOES HERE!!!.
            </div>

            {/* 2. RHS: */}
            <div id="registerp-rhs">

                <div id="register-outermost-box">
                
                </div>

            </div>





        </div>
    );
}

export default Register;
