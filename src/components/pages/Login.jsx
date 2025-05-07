// Login page goes here (default page if not logged in).
//<h1>LOGIN GOES HERE!!!</h1>

import React, {useState} from "react";
import {login} from "../utility/api.js";

function Login() {
    return(
        <div id="loginp-outermost-div">
            {/* [1/3] - Outer-most <div> element containing the "Sign in to HackMD Clone" box. Should be centered in the middle of the screen. */} 
            <div id="login-outermost-box">
                <h1>Sign in to HackMD Clone</h1>
                {/* [2/3] - The box for entering the Username/Email and Password login (and resetting password with "Forget Password"). Also login button: */} 
                <div id="login-username-pword">

                    {/* 2.1 - Section for inputting the username or email address for login: */}
                    <div id="login-username-div" style={{width:"90%"}}>
                        <div>Username or email address</div>
                        <input id="loginp-unemail-input" style={{width:"97.25%"}} type="text"/>
                    </div>

                    {/* 2.2 - Section for inputting th epassword for login (or for resetting password if needed): */}
                    <div id="login-pword-div" style={{width:"90%"}}>
                        
                        {/*<p>Password  Forget Password?</p>*/}
                        <div style={{display:"flex", flexDirection:"row"}}>
                            <div>Password</div>
                            <a href="url">Forgot Password?</a>
                        </div>


                        <input id="loginp-pword-input"  style={{width:"97.25%"}} type="text"/>
                    </div>

                    {/* 2.3 - Sign-in Button: */}
                    <button id="loginp-signin-btn" style={{marginTop:"4%"}}>SIGN IN</button>






                    {/* DEBUG: Don't forget - I want to make it so that if you click enter while the cursor is inside of
                    <input id="loginp-pword-input"> or <input id="loginp-unemail-input">, then that's equivalent to signing in... */}

                    {/* NOTE: DON'T FORGET TO INSERT A GREEN "LOG IN" BUTTON HERE!!! */}

                    {/*<div style={{borderStyle:"solid"}}>[INSERT USERNAME]</div>*/}
                    {/*<div style={{borderStyle:"solid"}}>[INSERT PASSWORD]</div>*/}

                </div>
                {/* [3/3] - The box beneath the Username/Email and Password login box for switching to the Registration page: */}
                <div id="login-new-acc">
                    New to HackMD Clone? Create Account
                </div>
            </div>
        </div>
    );
}

export default Login;