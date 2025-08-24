import {useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import {checkValidEmail} from "../utility/utilityFuncs.js";
import {register} from "../utility/api.js";

function Register() {
    const emailInputRef = useRef(null);
    const pwordInputRef = useRef(null);
    const unameInputRef = useRef(null);

    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [usernameError, setUsernameError] = useState(false);

    /* NOTE: For now, upon successful Registry, let's re-route to the Login page. But when this is more fleshed out, let's make it so
    that there's some sort of animated pop-up that says "Registration successful! Would you like to login now?" (with option to click login). */
    const navigate = useNavigate(); // For re-directing to Login page on successful Registration.

    // Pre-register button that ensures all forms are filled:
    const checkFormsFilled = () => {
        if(!checkValidEmail(emailInputRef.current.value)) {
            setEmailError(true);
            setTimeout(()=> setEmailError(false), 2500);
            return false;
        } else if(pwordInputRef.current.value === "" || !(pwordInputRef.current.value.length > 7)) {
            setPasswordError(true);
            setTimeout(()=> setPasswordError(false), 2500);
            return false;
        } else if(unameInputRef.current.value === "" || !(unameInputRef.current.value.length > 7)) {
            setUsernameError(true);
            setTimeout(()=> setUsernameError(false), 2500);
            return false;
        } else {
            // Allow register attempt:
            return true;
        }
    };

    return (
        /* The contents of the outermost <div> will be two primary inner <div> elements equally partitioned
        to the left and right (just like the GitHub Registration webpage as of 5/7/25). In the <div> below, there will
        be some sort of design and interactive Text advertising the site -- while, the actual Registration form will be to its right. */

        <div id="registerp-outermost-div"
            style={{
                display: "flex",
                height:"100%",
                width:"100%",
                backgroundColor: "#000",
                fontFamily: "monospace",
                color: "#00FF41",
                overflow: "hidden",
            }}
        >
            <div id="registerp" 
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px",
                }}
            >
                <div style={{width: "100%",textAlign: "right",fontSize: "16px",marginBottom: "10px",}}>
                    Already have an account?{" "}
                    <a href="Login" style={{textDecoration: "underline",color: "#00FF41",fontWeight: "bold",}}>
                        Sign in →
                    </a>
                </div>

                {/* Beneath that is the much larger <div> element where the actual Registration form is: */}
                <div id="register-outermost-box"
                    style={{
                        height: "auto",
                        width: "450px",
                        backgroundColor: "#0D0208",
                        border: "2px solid #00FF41",
                        borderRadius: "12px",
                        boxShadow: "0 0 10px #00FF41",
                        padding: "30px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        marginTop: "60px",
                    }}
                >
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
                        Sign up to HackMD Clone
                    </h1>

                    <form
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                        onSubmit={async (e) => {
                            e.preventDefault(); // The Register logic only occurs if all Register forms are completed (none empty).
                            const formsFilled = checkFormsFilled(); // Ensure all the Register forms are filled (nothing empty).

                            if (formsFilled) {
                                const email = emailInputRef.current.value;
                                const password = pwordInputRef.current.value;
                                const username = unameInputRef.current.value;
                                const result = await register({ username, email, password });

                                if (result.error) {
                                    console.error("REGISTRATION FAILED: ", result.error);
                                    alert("REGISTRATION FAILED: ", result.error);
                                } else {
                                    console.log("REGISTRATION SUCCESSFUL.");
                                    navigate("/Login");
                                }
                            }
                        }}
                    >
                        {/* The header above and the "Finalize Register" button should be centered in the middle of the parent <div>, but
                        everything in-between (the actual Registration form values) should be aligned to the left: */}
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                marginBottom: "20px",
                            }}
                        >
                            {/* 1. Email input: */}
                            <div style={{ marginBottom: "20px", width: "100%" }}>
                                <label style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px", display: "block" }}>
                                    Email*
                                </label>

                                {emailError && (
                                    <div style={{color: "#FF4C4C",fontSize: "14px",marginBottom: "5px",animation: "fadeInOut 2.5s ease-in-out",}}>
                                        ⚠ Please enter a "valid" email. (Just meet the *@*.* regex).
                                    </div>
                                )}

                                <input
                                    id="registerp-email-input"
                                    ref={emailInputRef}
                                    type="text"
                                    placeholder="Email"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        backgroundColor: "#000",
                                        color: "#00FF41",
                                        border: "1px solid #00FF41",
                                        borderRadius: "4px",
                                        fontSize: "16px",
                                    }}
                                />
                            </div>

                            {/* 2. Password input: */}
                            <div style={{ marginBottom: "20px", width: "100%" }}>
                                <label style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px", display: "block" }}>
                                    Password*
                                </label>
                                
                                {passwordError && (
                                    <div style={{color: "#FF4C4C",fontSize: "14px",marginBottom: "5px",animation: "fadeInOut 2.5s ease-in-out",}}>
                                        ⚠ Please enter a valid password.
                                    </div>
                                )}

                                <input
                                    id="registerp-pword-input"
                                    ref={pwordInputRef}
                                    type="password"
                                    placeholder="Password"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        backgroundColor: "#000",
                                        color: "#00FF41",
                                        border: "1px solid #00FF41",
                                        borderRadius: "4px",
                                        fontSize: "16px",
                                    }}
                                />
                                <div style={{ fontSize: "13px", marginTop: "5px" }}>
                                    Password must be at least 8 characters. That's the only limitation ¯\_(ツ)_/¯
                                </div>
                            </div>

                            {/* 3. Username input: */}
                            <div style={{ marginBottom: "20px", width: "100%" }}>
                                <label style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px", display: "block" }}>
                                    Username*
                                </label>
                                
                                {usernameError && (
                                    <div style={{color: "#FF4C4C",fontSize: "14px",marginBottom: "5px",animation: "fadeInOut 2.5s ease-in-out",}}>
                                        ⚠ Please enter a valid username.
                                    </div>
                                )}

                                <input
                                    id="registerp-uname-input"
                                    ref={unameInputRef}
                                    type="text"
                                    placeholder="Username"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        backgroundColor: "#000",
                                        color: "#00FF41",
                                        border: "1px solid #00FF41",
                                        borderRadius: "4px",
                                        fontSize: "16px",
                                    }}
                                />
                                <div style={{ fontSize: "13px", marginTop: "5px" }}>
                                    Same rules as the password.
                                </div>
                            </div>
                        </div>

                        {/* The "Finalize Register" button: */}
                        <button
                            id="registerp-register-btn"
                            style={{
                                fontSize: "18px",
                                fontWeight: "bold",
                                height: "45px",
                                width: "100%",
                                backgroundColor: "#000",
                                color: "#00FF41",
                                border: "1px solid #00FF41",
                                borderRadius: "6px",
                                boxShadow: "0 0 6px #00FF41",
                                cursor: "pointer",
                                letterSpacing: "1px",
                            }}
                        >
                            REGISTER
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
