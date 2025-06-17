import React, {useState, useEffect, useRef} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {login, getCurrentUser} from "../utility/api.js";

function Login({ setUser, setToken }) {
    const unEmailInputRef = useRef(null);
    const pwordInputRef = useRef(null);
    const signInBtnRef = useRef(null);
    const navigate = useNavigate(); // For re-directing to Dashboard page on successful login. 

    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    // Pre-login function that just ensures all forms are filled:
    const checkFormsFilled = () => {
        // NOTE: Since this field accepts email OR username, I will allow for non-email regex inputs (they'll be caught in the actual Login attempt):
        if(unEmailInputRef.current.value === "") {
            setEmailError(true);
            setTimeout(()=> setEmailError(false), 2500);
            return false;
        } else if(pwordInputRef.current.value === "") {
            setPasswordError(true);
            setTimeout(()=> setPasswordError(false), 2500);
            return false;
        } else {
            // Allow sign-in attempt:
            return true;
        }
    };

    // This useEffect hook is just for when you click "enter" to do the Sign In instead of clicking the actual Sign In button:
    useEffect(()=> {
        /* My log-in homepage is (pretty much exactly) moddled after the Github "Sign In" webpage, and so I want
        to make it so that -- as a shortcut -- you can click "Enter" on your keyboard as an alternative to clicking the big
        "Sign In" button. Like in GitHub, I'll make it so that "Enter" acts as a shortcut, but will only work if both the
        username/email input field and password field have some text written in them.

        DEBUG:+NOTE: GitHub has an animated pop-up notifying that a Text Field is empty if you attempt this when one is...
        ^ I'm not going to worry about doing any of that fancy stuff for now. */
        const handleEnterKey = (e) => {
            if(e.key === 'Enter') {
                signInBtnRef.current.click();
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

    return (
        <div
            id="loginp-outermost-div"
            style={{
                height:"100%",
                width: "100%",
                backgroundColor: "#000",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "monospace",
                color: "#00FF41",
                overflow:"hidden",
                marginTop:"10%",
            }}
        >
            {/* [1/3] - Outer-most <div> element containing the "Sign in to HackMD Clone" box. Should be centered in the middle of the screen. */} 
            <div
                id="login-outermost-box"
                style={{
                    width: "400px",
                    padding: "30px",
                    backgroundColor: "#0D0208",
                    border: "2px solid #00FF41",
                    borderRadius: "12px",
                    boxShadow: "0 0 10px #00FF41",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                }}
            >
                <h1 style={{ marginBottom: "0px", fontSize: "1.5rem" }}>
                    Sign in to HackMD Clone
                </h1>

                {/* [2/3] - The box for entering the Username/Email and Password login (and resetting password with "Forget Password"). Also login button: */} 
                <div id="login-username-pword" style={{ width: "100%" }}>
                    <form
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                        onSubmit={async (e) => {
                            e.preventDefault(); // The sign-in logic only occurs if all login forms are completed (none empty).

                            const formsFilled = checkFormsFilled(); // Ensure all the login forms are filled (nothing empty).

                            if (formsFilled) {
                                const unEmail = unEmailInputRef.current.value;
                                const password = pwordInputRef.current.value;

                                try {
                                    const result = await login({ unEmail, password });

                                    if (result.token) {
                                        localStorage.setItem("token", result.token);
                                        setToken(result.token);

                                        const userData = await getCurrentUser(result.token);
                                        setUser(userData);

                                        console.log("DEBUG: LOGIN SUCCESSFUL!!!: ", userData);
                                        // NOTE:+DEBUG: After login success I'm supposed to re-direct the user to the dashboard. (DEBUG: COME BACK HERE):
                                        navigate('/dashboard');
                                    } else {
                                        console.error("Login failed: ", result.message || result);
                                        alert("DEBUG: LOGIN FAILED. PLEASE CHECK YOUR CREDENTIALS!");
                                    }
                                } catch (err) {
                                    console.error("Login error: ", err);
                                    alert("DEBUG: ERROR OCCURRED DURING LOGIN!");
                                }
                            }
                        }}
                    >
                        {/* 2.1 - Section for inputting the username or email address for login: */}
                        <div id="login-username-div" style={{ width: "90%", padding: "3.75%", marginTop: "2.5%" }}>
                            <div style={{ fontSize: "18px" }}>Username or email address</div>

                            {/* Disclaimer message for when the user attempts to Login w/out inputting email or username: */}
                            {emailError && (
                                <div style={{color: "#FF4C4C",fontSize: "14px",marginBottom: "5px",animation: "fadeInOut 2.5s ease-in-out",}}>
                                    ⚠ Please enter your email or username.
                                </div>
                            )}

                            <input
                                id="loginp-unemail-input"
                                type="text"
                                ref={unEmailInputRef}
                                style={{
                                    width: "97.25%",
                                    padding: "8px",
                                    backgroundColor: "#000",
                                    color: "#00FF41",
                                    border: "1px solid #00FF41",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>

                        {/* 2.2 - Section for inputting the password for login (or for resetting password if needed): */}
                        <div id="login-pword-div" style={{ width: "90%", padding: "3.75%" }}>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                <div style={{ fontSize: "18px" }}>Password</div>
                                {/*<a href="INSERT LINK TO RESET PASSWORD" style={{fontSize: "18px",textDecoration: "none",color: "#00FF41",}}>
                                    Forgot Password? 
                                </a> // <-- Decided I won't be moving forward with this (not worth the time and effort for a minor feature). */}
                            </div>
                                
                            {/* Disclaimer message for when the user attempts to Login w/out inputting password: */}
                            {passwordError && (
                                <div style={{color: "#FF4C4C",fontSize: "14px",marginBottom: "5px",animation: "fadeInOut 2.5s ease-in-out"}}>
                                    ⚠ Please enter your password.
                                </div>
                            )}

                            <input
                                id="loginp-pword-input"
                                type="password"
                                ref={pwordInputRef}
                                style={{
                                    width: "97.25%",
                                    padding: "8px",
                                    backgroundColor: "#000",
                                    color: "#00FF41",
                                    border: "1px solid #00FF41",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>

                        {/* 2.3 - Sign-in Button: */}
                        <button
                            id="loginp-signin-btn"
                            type="submit"
                            ref={signInBtnRef}
                            style={{
                                marginTop: "2.25%",
                                marginLeft: "2%",
                                padding: "10px 20px",
                                width: "95%",
                                backgroundColor: "#000",
                                color: "#00FF41",
                                border: "1px solid #00FF41",
                                borderRadius: "6px",
                                boxShadow: "0 0 6px #00FF41",
                                cursor: "pointer",
                                fontWeight: "bold",
                                letterSpacing: "1px",
                            }}
                        >
                            SIGN IN
                        </button>
                    </form>
                </div>

                {/* [3/3] - The box beneath the Username/Email and Password login box for switching to the Registration page: */}
                <div
                    id="login-new-acc"
                    style={{
                        fontSize: "17px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div style={{ marginLeft: "10px" }}>New to HackMD Clone?</div>
                    <a
                        href="Register"
                        style={{
                            textDecoration: "underline",
                            color: "#00FF41",
                            fontWeight: "bold",
                        }}
                    >
                        Create an account.
                    </a>
                </div>
            </div>
        </div>
    );

}

export default Login;
