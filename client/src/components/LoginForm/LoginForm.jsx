import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LOGIN_USER,
  CREATE_USER,
  FORGOT_PASSWORD,
  VERIFY_RESET_CODE,
  RESET_PASSWORD,
  SEND_AUTH_CODE,
  VERIFY_AUTH_CODE,
  LOGIN_WITH_CODE,
} from "../../utils/mutations";
import { CHECK_EMAIL_EXISTS } from "../../utils/queries";
import { useMutation, useApolloClient } from "@apollo/client";
import Auth from "../../utils/auth";
import SnackBar from "../SnackBarComponent/SnackBar";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Fingerprint,
  Key,
  User,
  ArrowLeft,
  Terminal,
  Eye,
  EyeOff,
} from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    .login-form-container {
      width: 100%;
      min-height: 580px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.05);
      font-family: 'DM Sans', sans-serif;
    }

    @media (min-width: 768px) {
      .login-form-container {
        flex-direction: row;
        height: 600px;
      }
    }

    /* Ліва панель */
    .lf-left-panel {
      display: none;
    }

    @media (min-width: 768px) {
      .lf-left-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 41.666667%;
        padding: 2.5rem 3rem;
        background: linear-gradient(to bottom right, #1c1c1f, #050505);
        border-right: 1px solid rgba(255, 255, 255, 0.16);
        position: relative;
        overflow: hidden;
      }
    }

    @media (min-width: 1024px) {
      .lf-left-panel {
        padding: 3.5rem;
      }
    }

    /* Права панель */
    .lf-right-panel {
      width: 100%;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      height: 580px;
    }

    @media (min-width: 768px) {
      .lf-right-panel {
        width: 58.333333%;
        padding: 3rem;
        height: 600px;
      }
    }

    @media (min-width: 1024px) {
      .lf-right-panel {
        padding: 4rem;
      }
    }

    /* Заголовки */
    .lf-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #f0f0f5;
    }

    @media (min-width: 1024px) {
      .lf-title {
        font-size: 32px;
      }
    }

    .lf-subtitle {
      font-size: 16px;
      color: #a3a3b0;
      margin-top: 4px;
      font-weight: 400;
    }

    .lf-subtitle span {
      color: #e2e2ea;
    }

    /* Лейбли */
    .lf-label {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #b0b0ba;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    /* Інпути */
    .lf-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #f0f0f5;
      padding: 14px 16px;
      outline: none;
      font-size: 17px;
      font-weight: 400;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-family: 'DM Sans', sans-serif;
    }

    .lf-input:focus {
      border-color: #e74c3c;
      background: rgba(231, 76, 60, 0.04);
    }

    .lf-input-password {
      padding-right: 48px;
      letter-spacing: 0.15em;
    }

    .lf-input-code {
      text-align: center;
      letter-spacing: 0.5em;
      font-size: 22px;
    }

    .lf-input-name {
      padding: 12px 16px;
      font-size: 16px;
    }

    /* Кнопка показу пароля */
    .lf-eye-btn {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #8a8a96;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 4px;
    }

    .lf-eye-btn:hover {
      color: #d0d0da;
    }

    /* Кнопки */
    .lf-btn-primary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 18px 24px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: #c0392b;
      color: #ffffff;
      border: 1px solid #e74c3c;
    }

    .lf-btn-primary:hover:not(:disabled) {
      background: #e74c3c;
      border-color: #ff6b5a;
    }

    .lf-btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .lf-btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 16px 24px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: transparent;
      color: #e0e0ea;
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .lf-btn-secondary:hover {
      border-color: #e74c3c;
      background: rgba(231, 76, 60, 0.06);
    }

    .lf-btn-back {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #a0a0ab;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 8px;
    }

    .lf-btn-back:hover {
      color: #ffffff;
    }

    /* Forgot link */
    .lf-forgot-link {
      font-size: 14px;
      color: #e74c3c;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
      font-weight: 500;
    }

    .lf-forgot-link:hover {
      color: #ff6b5a;
    }

    /* Google роздільник */
    .lf-divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
    }

    .lf-divider-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #8a8a96;
    }

    /* Брендинг лівої панелі */
    .lf-brand-icon {
      color: #e74c3c;
    }

    .lf-brand-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #e74c3c;
    }

    .lf-brand-heading {
      font-family: 'Bebas Neue', cursive;
      font-size: 52px;
      line-height: 0.9;
      color: #f5f5fa;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    @media (min-width: 1024px) {
      .lf-brand-heading {
        font-size: 60px;
      }
    }

    .lf-brand-text {
      font-size: 16px;
      color: #a3a3b0;
      line-height: 1.6;
      max-width: 280px;
      font-weight: 400;
    }

    .lf-brand-footer {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #8a8a96;
    }
  `}</style>
);

const LoginForm = () => {
  const client = useApolloClient();

  const [mode, setMode] = useState("EMAIL");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [authJwt, setAuthJwt] = useState("");
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarMsg, setSnackBarMsg] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [login] = useMutation(LOGIN_USER);
  const [createUser] = useMutation(CREATE_USER);
  const [forgotPassword] = useMutation(FORGOT_PASSWORD);
  const [verifyResetCode] = useMutation(VERIFY_RESET_CODE);
  const [resetPassword] = useMutation(RESET_PASSWORD);

  const [sendAuthCode] = useMutation(SEND_AUTH_CODE);
  const [verifyAuthCode] = useMutation(VERIFY_AUTH_CODE);
  const [loginWithCode] = useMutation(LOGIN_WITH_CODE);

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: response.idToken,
          action: "login",
        }),
      });
      const data = await res.json();
      if (data.token) {
        Auth.login(data.token);
      } else {
        openSnackBar(data.error || "Google authentication failed");
      }
    } catch (err) {
      openSnackBar("Error during Google authentication");
    }
  };

  const openSnackBar = (message) => {
    setSnackBarMsg(message);
    setShowSnackBar(true);
    setTimeout(() => setShowSnackBar(false), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBack = () => {
    switch (mode) {
      case "PASSWORD":
        setMode("EMAIL");
        break;
      case "LOGIN_CODE":
        setMode("PASSWORD");
        break;
      case "SIGNUP_PASSWORD":
        setMode("EMAIL");
        break;
      case "SIGNUP_CODE":
        setMode("SIGNUP_PASSWORD");
        break;
      case "SIGNUP_NAME":
        setMode("SIGNUP_CODE");
        break;
      case "FORGOT_CODE":
        setMode("PASSWORD");
        break;
      case "FORGOT_RESET":
        setMode("FORGOT_CODE");
        break;
      default:
        setMode("EMAIL");
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return;
    setIsCheckingEmail(true);

    try {
      const { data } = await client.query({
        query: CHECK_EMAIL_EXISTS,
        variables: { email: formData.email.toLowerCase() },
        fetchPolicy: "network-only",
      });

      if (data.checkEmailExists) {
        setMode("PASSWORD");
      } else {
        setMode("SIGNUP_PASSWORD");
      }
    } catch (err) {
      openSnackBar("Network error. Please try again.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({
        variables: {
          email: formData.email.toLowerCase(),
          password: formData.password,
        },
      });
      if (data?.login) Auth.login(data.login.token);
    } catch (err) {
      if (err.message.includes("blocked")) {
        openSnackBar(err.message);
      } else {
        openSnackBar("Wrong email or password. Please try again.");
      }
    }
  };

  const handleSendLoginCode = async () => {
    try {
      const { data } = await sendAuthCode({
        variables: { email: formData.email.toLowerCase() },
      });
      setAuthJwt(data.sendAuthCode);
      openSnackBar("Verification code sent to your email!");
      setMode("LOGIN_CODE");
    } catch (err) {
      openSnackBar(err.message || "Failed to send code. Try again.");
    }
  };

  const handleLoginCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await loginWithCode({
        variables: {
          email: formData.email.toLowerCase(),
          code: formData.code,
          authJwt,
        },
      });
      if (data?.loginWithCode) Auth.login(data.loginWithCode.token);
    } catch (err) {
      if (err.message.includes("blocked")) {
        openSnackBar(err.message);
      } else {
        openSnackBar("Invalid or expired verification code.");
      }
    }
  };

  const handleSignupPasswordSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      openSnackBar("Password must be at least 8 characters long.");
      return;
    }
    try {
      const { data } = await sendAuthCode({
        variables: { email: formData.email.toLowerCase() },
      });
      setAuthJwt(data.sendAuthCode);
      openSnackBar("Verification code sent to your email!");
      setMode("SIGNUP_CODE");
    } catch (err) {
      openSnackBar(err.message || "Failed to send code. Try again.");
    }
  };

  const handleSignupCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await verifyAuthCode({
        variables: {
          email: formData.email.toLowerCase(),
          code: formData.code,
          authJwt,
        },
      });
      if (data?.verifyAuthCode) {
        setMode("SIGNUP_NAME");
      }
    } catch (err) {
      openSnackBar("Invalid or expired verification code.");
    }
  };

  const handleSignupNameSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createUser({
        variables: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase(),
          password: formData.password,
        },
      });
      if (data?.createUser?.token) Auth.login(data.createUser.token);
    } catch (err) {
      openSnackBar(err.message || "Failed to register profile.");
    }
  };

  const handleForgotClick = async () => {
    try {
      await forgotPassword({
        variables: { email: formData.email.toLowerCase() },
      });
      openSnackBar("Password reset code sent to your email!");
      setMode("FORGOT_CODE");
    } catch (err) {
      openSnackBar(err.message || "Failed to send reset code. Try again.");
    }
  };

  const handleForgotCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyResetCode({
        variables: {
          email: formData.email.toLowerCase(),
          code: formData.code,
        },
      });
      openSnackBar("Code verified! Set your new password.");
      setMode("FORGOT_RESET");
    } catch (err) {
      openSnackBar("Invalid or expired reset code.");
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      openSnackBar("Passwords don't match.");
      return;
    }
    if (formData.newPassword.length < 8) {
      openSnackBar("Password must be at least 8 characters long.");
      return;
    }
    try {
      await resetPassword({
        variables: {
          email: formData.email.toLowerCase(),
          code: formData.code,
          newPassword: formData.newPassword,
        },
      });
      openSnackBar("Password reset successful! Please log in.");
      setFormData({
        ...formData,
        password: "",
        code: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMode("PASSWORD");
    } catch (err) {
      openSnackBar(err.message || "Failed to reset password.");
    }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  let brandingTitle = "SYSTEM ACCESS";
  let brandingSub = "IDENTIFICATION";
  if (mode.startsWith("SIGNUP")) {
    brandingTitle = "NEW RECRUIT";
    brandingSub = "ENLIST NOW";
  } else if (mode === "PASSWORD" || mode === "LOGIN_CODE") {
    brandingTitle = "WELCOME BACK";
    brandingSub = "AGENT";
  } else if (mode.startsWith("FORGOT")) {
    brandingTitle = "SECURITY OVERRIDE";
    brandingSub = "RECOVER ACCESS";
  }

  return (
    <>
      <GlobalStyles />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="login-form-container"
      >
        {/* Ліва панель */}
        <div className="lf-left-panel">
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-12"
            >
              <ShieldCheck size={28} className="lf-brand-icon" />
              <span className="lf-brand-title">Secure Portal</span>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.h2
                key={brandingTitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="lf-brand-heading"
              >
                {brandingTitle},<br />
                {brandingSub}
              </motion.h2>
            </AnimatePresence>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="lf-brand-text"
            >
              Authenticate your credentials to access your mission dashboard,
              review bookings, and unlock new quest rooms.
            </motion.p>
          </div>

          <div className="relative z-10">
            <div className="w-16 h-px bg-[#2a2a2f] mb-4" />
            <div className="flex items-center gap-2">
              <Fingerprint size={14} className="lf-brand-icon opacity-70" />
              <span className="lf-brand-footer">
                System Online • Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Права панель */}
        <div className="lf-right-panel">
          <div className="md:hidden mb-4 text-center">
            <h2
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: "32px",
                color: "#f5f5fa",
                marginBottom: "8px",
              }}
            >
              ACCESS TERMINAL
            </h2>
            <div
              style={{
                width: "48px",
                height: "4px",
                background: "#e74c3c",
                margin: "0 auto",
              }}
            />
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto md:max-w-md md:mx-0 lg:ml-8 w-full relative">
            <AnimatePresence mode="wait">
              {/* EMAIL */}
              {mode === "EMAIL" && (
                <motion.div
                  key="email"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Identification</h3>
                    <p className="lf-subtitle">
                      Enter your email to continue.
                    </p>
                  </div>
                  <form
                    onSubmit={handleEmailSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <label className="lf-label">
                        <Mail size={16} /> Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        autoFocus
                        className="lf-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCheckingEmail}
                      className="lf-btn-primary"
                    >
                      <span>
                        {isCheckingEmail ? "Scanning..." : "Continue"}
                      </span>
                      {!isCheckingEmail && <ArrowRight size={20} />}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* PASSWORD */}
              {mode === "PASSWORD" && (
                <motion.div
                  key="password"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Authentication</h3>
                    <p className="lf-subtitle">
                      Provide your credentials for{" "}
                      <span>{formData.email}</span>
                    </p>
                  </div>
                  <form
                    onSubmit={handleLoginSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="lf-label" style={{ marginBottom: 0 }}>
                          <Lock size={16} /> Authorization Key
                        </label>
                        <button
                          type="button"
                        onClick={handleForgotClick}
                          className="lf-forgot-link"
                        >
                          Forgot Key?
                        </button>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoFocus
                          value={formData.password}
                          onChange={handleInputChange}
                          className="lf-input lf-input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="lf-eye-btn"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-2">
                      <button type="submit" className="lf-btn-primary">
                        <span>Initialize Session</span>
                        <ArrowRight size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={handleSendLoginCode}
                        className="lf-btn-secondary"
                      >
                        Login with Verification Code
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* SIGNUP PASSWORD */}
              {mode === "SIGNUP_PASSWORD" && (
                <motion.div
                  key="signup_pwd"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Enlistment</h3>
                    <p className="lf-subtitle">
                      Create a secure password for{" "}
                      <span>{formData.email}</span>
                    </p>
                  </div>
                  <form
                    onSubmit={handleSignupPasswordSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <label className="lf-label">
                        <Lock size={16} /> Secure Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoFocus
                          value={formData.password}
                          onChange={handleInputChange}
                          className="lf-input lf-input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="lf-eye-btn"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="lf-btn-primary mt-2">
                      <span>Continue</span>
                      <ArrowRight size={20} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* CODE VERIFICATION */}
              {(mode === "SIGNUP_CODE" ||
                mode === "LOGIN_CODE" ||
                mode === "FORGOT_CODE") && (
                <motion.div
                  key="code"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Verify Identity</h3>
                    <p className="lf-subtitle">
                      Enter the 6-digit code sent to{" "}
                      <span>{formData.email}</span>
                    </p>
                  </div>
                  <form
                    onSubmit={
                      mode === "SIGNUP_CODE"
                        ? handleSignupCodeSubmit
                        : mode === "LOGIN_CODE"
                        ? handleLoginCodeSubmit
                        : handleForgotCodeSubmit
                    }
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <label className="lf-label">
                        <Key size={16} /> 6-Digit Code
                      </label>
                      <input
                        name="code"
                        type="text"
                        maxLength="6"
                        required
                        autoFocus
                        value={formData.code}
                        onChange={handleInputChange}
                        className="lf-input lf-input-code"
                      />
                    </div>
                    <button type="submit" className="lf-btn-primary mt-2">
                      <span>Verify Code</span>
                      <ShieldCheck size={20} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* SIGNUP NAME */}
              {mode === "SIGNUP_NAME" && (
                <motion.div
                  key="signup_name"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Profile Details</h3>
                    <p className="lf-subtitle">
                      Identity verified. Enter your name.
                    </p>
                  </div>
                  <form
                    onSubmit={handleSignupNameSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div className="flex gap-4">
                      <div style={{ width: "100%" }}>
                        <label
                          className="lf-label"
                          style={{ marginBottom: "6px" }}
                        >
                          <User size={14} /> First Name
                        </label>
                        <input
                          name="firstName"
                          type="text"
                          required
                          autoFocus
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="lf-input lf-input-name"
                        />
                      </div>
                      <div style={{ width: "100%" }}>
                        <label
                          className="lf-label"
                          style={{ marginBottom: "6px" }}
                        >
                          <User size={14} /> Last Name
                        </label>
                        <input
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="lf-input lf-input-name"
                        />
                      </div>
                    </div>
                    <button type="submit" className="lf-btn-primary mt-2">
                      <span>Register Profile</span>
                      <Terminal size={20} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* FORGOT RESET */}
              {mode === "FORGOT_RESET" && (
                <motion.div
                  key="forgot_reset"
                  variants={slideVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="lf-title">Set New Key</h3>
                    <p className="lf-subtitle">
                      Identity verified. Establish your new password.
                    </p>
                  </div>
                  <form
                    onSubmit={handleForgotResetSubmit}
                    className="flex flex-col gap-5"
                  >
                    <div>
                      <label className="lf-label">
                        <Lock size={16} /> New Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          required
                          autoFocus
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="lf-input lf-input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="lf-eye-btn"
                        >
                          {showPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="lf-label">
                        <Lock size={16} /> Confirm New Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="lf-input lf-input-password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="lf-eye-btn"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="lf-btn-primary mt-2">
                      <span>Save & Authenticate</span>
                      <ShieldCheck size={20} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="h-20 mt-auto flex flex-col justify-end max-w-sm mx-auto md:max-w-md md:mx-0 lg:ml-8 w-full relative">
            <div
              className={`absolute inset-x-0 bottom-0 transition-all duration-500 ease-in-out ${
                mode === "EMAIL"
                  ? "opacity-100 z-10 translate-y-0"
                  : "opacity-0 z-0 pointer-events-none translate-y-4"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="lf-divider-line" />
                <span className="lf-divider-text">Or bypass via</span>
                <div className="lf-divider-line" />
              </div>
              <div className="flex justify-center w-full">
                <GoogleSignInButton onCredential={handleGoogleResponse} onError={openSnackBar} />
              </div>
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 flex justify-center transition-all duration-500 ease-in-out ${
                mode !== "EMAIL"
                  ? "opacity-100 z-10 translate-y-0"
                  : "opacity-0 z-0 pointer-events-none translate-y-4"
              }`}
            >
              <button onClick={handleBack} className="lf-btn-back">
                <ArrowLeft size={18} /> Abort & Return
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SnackBar рендериться через портал прямо в document.body.
          Це обходить БУДЬ-ЯКИЙ transform/overflow-hidden контейнер вище по дереву
          (наприклад, page-transition wrapper у роутері), який перетворює
          position: fixed на "прив'язане" до себе і тому обрізає повідомлення. */}
      {createPortal(
        <AnimatePresence>
          {showSnackBar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-[9999]"
            >
              <SnackBar message={snackBarMsg} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default LoginForm;
