// REGISTER PAGE (will be pretty similar structurally to Login.jsx):
/* NOTE: ^ Maybe I can change the design afterwards when all the core functionality is finished. Similar to how
the Github Registration page is super fancy compared to the Login one...*/

// ^ Yeah, I'm going to base the design here off of GitHub's Registration page. So the "Sign Up" stuff will all be on the right-hand side of the webpage

import React, {useState, useEffect, useRef} from "react";
import {register} from "../utility/api.js";

function Register() {
    return(
        /* The contents of the outermost <div> will be two primary inner <div> elements equally partitioned
        to the left and right (just like the GitHub Registration webpage as of 5/7/25). In the <div> below, there will
        be some sort of design and interactive Text advertising the site -- while, the actual Registration form will be to its right. */

        <div id="registerp-outermost-div" style={{display:"flex",height:"98vh",width:"99vw",position:"absolute", overflow:"hidden", borderStyle:"bold", borderColor:"red"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"bold" onwards later. */}
            {/* 1. LHS: */}
            <div id="registerp-lhs" style={{height:"100%",width:"50%", borderStyle:"bold", borderColor:"orange"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"bold" onwards later. */}
                SOMETHING GOES HERE!!! (PROBABLY JUST HAVE SOME FANCY VISUAL DESIGN HERE).
            </div>

            {/* 2. RHS: */}
            <div id="registerp-rhs" style={{height:"100%", width:"50%", borderStyle:"bold", borderColor:"blue"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"bold" onwards later. */}
                {/* At the top row of the page's RHS will be a comment re-directing to the Login page. */}
                <div style={{textAlign:"right", borderStyle:"solid"}}>
                    Already have an account? <a href="Login">Sign in →</a>
                </div>



                <div id="register-outermost-box">
                
                </div>
            </div>



            {/* 1. LHS:
            <div id="registerp-lhs" style={{borderStyle:"solid"}}> * <--DEBUG: solid borderStyle is *
                SOMETHING GOES HERE!!! (PROBABLY JUST HAVE SOME FANCY VISUAL DESIGN HERE).
            </div>*/}
            {/* 2. RHS: *
            <div id="registerp-rhs" style={{borderStyle:"solid"}} >
                * At the top row of the page's RHS will be a comment re-directing to the Login page. *
                <div style={{textAlign:"right", borderStyle:"solid"}}>
                    Already have an account? <a href="Login">Sign in →</a>
                </div>
                
                * Beneath that is  *
                <div id="register-outermost-box">
                
                </div>
            </div> */}



        </div>
    );
}

export default Register;
