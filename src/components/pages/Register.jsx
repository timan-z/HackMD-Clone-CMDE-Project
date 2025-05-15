// REGISTER PAGE (will be pretty similar structurally to Login.jsx):
/* NOTE: ^ Maybe I can change the design afterwards when all the core functionality is finished. Similar to how
the Github Registration page is super fancy compared to the Login one...*/

// ^ Yeah, I'm going to base the design here off of GitHub's Registration page. So the "Sign Up" stuff will all be on the right-hand side of the webpage

import React, {useState, useEffect, useRef} from "react";
import { useNavigate } from "react-router-dom";
import {register} from "../utility/api.js";


/* 

DON'T FORGET: Solve this stupid problem: 
"Uncaught SyntaxError: The requested module '/src/components/pages/Register.jsx?t=1747099488268' does not provide an export named 'default' (at App.jsx:5:8)"
^ HAS SOMETHING TO DO WITH CACHING -- TOO TIRED TO FIGURE IT OUT TONIGHT.

*/



function Register() {

    const emailInputRef = useRef(null);
    const pwordInputRef = useRef(null);
    const unameInputRef = useRef(null);

    /* NOTE: For now, upon successful Registry, let's re-route to the Login page. But when this is more fleshed out, let's make it so
    that there's some sort of animated pop-up that says "Registration successful! Would you like to login now?" (with option to click login). */
    const navigate = useNavigate(); // For re-directing to Login page on successful Registration. DEBUG: FOR NOW!!!


    // Pre-register button that ensures all forms are filled:
    const checkFormsFilled = () => {
        if(emailInputRef.current.value === "") {
            console.log("debug: [INSERT CODE TO ADD POP-UP THAT SAYS \"FILL IN EMAIL FORM FIRST\"]");
            return false;
        } else if(pwordInputRef.current.value === "") {
            console.log("debug: [INSERT CODE TO ADD POP-UP THAT SAYS \"FILL IN PASSWORD FORM FIRST\"]");
            return false;
        } else if(unameInputRef.current.value === "") {
            console.log("debug: [INSERT CODE TO ADD POP-UP THAT SAYS \"FILL IN USERNAME FORM FIRST\"]");
            return false;
        } else {
            // Allow register attempt:
            return true;
        }
    };



    return(
        /* The contents of the outermost <div> will be two primary inner <div> elements equally partitioned
        to the left and right (just like the GitHub Registration webpage as of 5/7/25). In the <div> below, there will
        be some sort of design and interactive Text advertising the site -- while, the actual Registration form will be to its right. */

        <div id="registerp-outermost-div" style={{display:"flex",height:"98vh",width:"99vw",position:"absolute", overflow:"hidden", borderStyle:"solid", borderColor:"red"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"solid" onwards later. */}
            {/* 1. LHS: */}
            <div id="registerp-lhs" style={{height:"100%",width:"50%", borderStyle:"solid", borderColor:"orange"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"solid" onwards later. */}
                SOMETHING GOES HERE!!! (PROBABLY JUST HAVE SOME FANCY VISUAL DESIGN HERE).
            </div>

            {/* 2. RHS: */}
            <div id="registerp-rhs" style={{height:"100%", width:"50%", display:"flex", flexDirection:"column", alignItems:"center", borderStyle:"solid", borderColor:"blue"}}> {/* <-- DEBUG: Don't forget to remove borderStyle:"solid" onwards later. */}
                {/* At the top row of the page's RHS will be a comment re-directing to the Login page. */}
                <div style={{width:"100%", textAlign:"right", fontSize:"18px", borderStyle:"solid"}}>
                    Already have an account? <a href="Login">Sign in →</a>
                </div>

                {/* Beneath that is the much larger <div> element where the actual Registration form is: */}
                <div id="register-outermost-box" 
                style={{height:"75%", width:"65%", display:"flex", flexDirection:"column", alignItems:"center", marginTop:"90px", 
                borderStyle:"solid" }} >
                    <h1>Sign up to HackMD Clone</h1>







                    <form style={{height:"100%", width:"100%", display:"flex", flexDirection:"column", alignItems:"center"}} onSubmit={ async (e) => {
                        e.preventDefault();  // The Register logic only occurs if all Register forms are completed (none empty).
                        const formsFilled = checkFormsFilled(); // Ensure all the Register forms are filled (nothing empty).

                        if(formsFilled) {
                            const email = emailInputRef.current.value;
                            const password = pwordInputRef.current.value;
                            const username = unameInputRef.current.value;

                            const result = await register({ username, email, password });

                            if(result.error) {
                                console.error("REGISTRATION FAILED: ", result.error);
                                // DEBUG:+NOTE: I SHOULD HAVE A POP-UP SHOW UP IN THE ACTUAL WEBPAGE WITH THIS.
                            } else {
                                console.log("REGISTRATION SUCCESSFUL.");
                                alert("DEBUG: REGISTRATION SUCCESSFUL -- CHECK MY TABLE IN POSTGRESQL TO MAKE SURE ALL IS GOOD.");
                                navigate("/Login");
                            }
                        }
                    }}>

                        {/* The header above and the "Finalize Register" button should be centered in the middle of the parent <div>, but
                        everything in-between (the actual Registration form values) should be aligned to the left: */}
                        <div style={{width:"100%", height:"50%", marginLeft:"5%", marginTop:"25px"}}>
                            {/* 1. Email input: */}
                            <div style={{paddingBottom:"17.25px"}}>
                                <div style={{fontWeight:"bold", fontSize:"20px"}}>Email*</div>
                                <input id="registerp-email-input" ref={emailInputRef} type="text" placeholder="Email" style={{width:"93%", height:"27px", fontSize:"17px"}}/>
                            </div>

                            {/* 2. Password input: */}
                            <div style={{paddingBottom:"17.25px"}}>
                                <div style={{fontWeight:"bold", fontSize:"20px"}}>Password*</div>
                                <input id="registerp-pword-input" ref={pwordInputRef} type="password" placeholder="Password" style={{width:"93%", height:"27px", fontSize:"17px"}}/>
                                Password must be at least 8 characters. That's the only limitation ¯\_(ツ)_/¯
                            </div>

                            {/* 3. Username input: */}
                            <div style={{paddingBottom:"17.25px"}}>
                                <div style={{fontWeight:"bold", fontSize:"20px"}}>Username*</div>
                                <input id="registerp-uname-input" ref={unameInputRef} type="text" placeholder="Username" style={{width:"93%", height:"27px", fontSize:"17px"}}/>
                                Same rules as the password.
                            </div>
                        </div>

                        {/* The "Finalize Register" button: */}
                        <button id="registerp-register-btn"
                        style={{fontSize:"20px", fontWeight:"bold", height:"60px", width:"40%", color:"white", border:"none", borderRadius:"8px", backgroundColor:"green", cursor:"pointer"
                        }}>REGISTER</button>
                    </form>


                </div>
            </div>

        </div>
    );
}

export default Register;
