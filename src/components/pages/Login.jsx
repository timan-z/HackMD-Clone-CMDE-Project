// Login page goes here (default page if not logged in).
//<h1>LOGIN GOES HERE!!!</h1>

import React, {useState, useEffect, useRef} from "react";
import {login} from "../utility/api.js";

function Login() {
    const unEmailInputRef = useRef(null);
    const pwordInputRef = useRef(null);
    const signInBtnRef = useRef(null);

    useEffect(()=> {
        /* My log-in homepage is (pretty much exactly) moddled after the Github "Sign In" webpage, and so I want
        to make it so that -- as a shortcut -- you can click "Enter" on your keyboard as an alternative to clicking the big
        "Sign In" button. Like in GitHub, I'll make it so that "Enter" acts as a shortcut, but will only work if both the
        username/email input field and password field have some text written in them.

        DEBUG:+NOTE: GitHub has an animated pop-up notifying that a Text Field is empty if you attempt this when one is...
        ^ I'm not going to worry about doing any of that fancy stuff for now. */
        const handleEnterKey = (e) => {
            if(e.key === 'Enter') {
                console.log("DEBUG: ENTER key was pressed!!!");
                console.log("DEBUG: The value of unEmailInputRef.current => [", unEmailInputRef.current, "]");
                console.log("DEBUG: The value of pwordInputRef.current => [", pwordInputRef.current, "]");
                console.log("DEBUG: =>", unEmailInputRef.current.value);
                console.log("DEBUG: =>", pwordInputRef.current.value);

                if(unEmailInputRef.current.value === "") {
                    console.log("debug: [INSERT CODE TO ADD POP-UP THAT SAYS \"FILL IN FORM FIRST\"]");
                } else if(pwordInputRef.current.value === "") {
                    console.log("debug: [INSERT CODE TO ADD POP-UP THAT SAYS \"FILL IN FORM FIRST\"]");
                } else {
                    // Attempt sign-in:
                    signInBtnRef.current.click();
                }
            }
        };

        const unEmailInput = unEmailInputRef.current;
        const pwordInput = pwordInputRef.current;
        unEmailInput.addEventListener('keydown', handleEnterKey);
        pwordInput.addEventListener('keydown', handleEnterKey);

        return () => {
            unEmailInput.removeEventListener('keydown', handleEnterKey);
            pwordInput.removeEventListener('keydown', handleEnterKey);
        };
    }, []);


    return(
        <div id="loginp-outermost-div">
            {/* [1/3] - Outer-most <div> element containing the "Sign in to HackMD Clone" box. Should be centered in the middle of the screen. */} 
            <div id="login-outermost-box">
                <h1>Sign in to HackMD Clone</h1>
                {/* [2/3] - The box for entering the Username/Email and Password login (and resetting password with "Forget Password"). Also login button: */} 
                <div id="login-username-pword">

                    {/* 2.1 - Section for inputting the username or email address for login: */}
                    <div id="login-username-div" style={{width:"90%", padding:"3.75%", marginTop:"2.5%"}}>
                        <div style={{fontSize:"18px"}}>Username or email address</div>
                        <input id="loginp-unemail-input" style={{width:"97.25%"}} type="text" ref={unEmailInputRef}/>
                    </div>

                    {/* 2.2 - Section for inputting th epassword for login (or for resetting password if needed): */}
                    <div id="login-pword-div" style={{width:"90%", padding:"3.75%"}}>
                        
                        {/*<p>Password  Forget Password?</p>*/}
                        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
                            <div style={{fontSize:"18px"}}>Password</div>
                            <a href="INSERT LINK TO RESET PASSWORD" style={{fontSize:"18px"}}>Forgot Password?</a>
                        </div>

                        <input id="loginp-pword-input" style={{width:"97.25%"}} type="password" ref={pwordInputRef}/>
                    </div>

                    {/* 2.3 - Sign-in Button: */}
                    <button id="loginp-signin-btn" style={{marginTop:"2.25%"}} ref={signInBtnRef} onClick={()=>{
                        // DEBUG: COME BACK AND INSERT SIGN-IN BUTTON CLICK LOGIC HERE!!!
                        console.log("DEBUG: COME BACK AND INSERT SIGN-IN BUTTON CLICK LOGIC HERE!!!");
                    }} >SIGN IN</button>

                </div>
                {/* [3/3] - The box beneath the Username/Email and Password login box for switching to the Registration page: */}
                <div id="login-new-acc" style={{fontSize:"17px", display:"flex", justifyContent:"center", alignItems:"center"}}>
                    <div style={{marginRight:"10px"}}>New to HackMD Clone?</div><a href="INSERT LINK TO REGISTRATION PAGE">Create an account.</a>
                </div>
            </div>
        </div>
    );
}

export default Login;
