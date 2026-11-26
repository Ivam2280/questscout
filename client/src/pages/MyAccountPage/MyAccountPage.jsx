import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ME_QUERY } from "../../utils/queries";
import {
  REQUEST_EMAIL_UPDATE,
  CONFIRM_EMAIL_UPDATE,
  UPDATE_NAME,
  UPDATE_PASSWORD,
  ADD_PASSWORD,
  FORGOT_PASSWORD,
  VERIFY_RESET_CODE,
  RESET_PASSWORD
} from "../../utils/mutations";
import SnackBar from "../../components/SnackBarComponent/SnackBar";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import { User, Mail, Edit2, X, Check, ArrowRight, ShieldAlert, Lock, Key, ArrowLeft, ShieldCheck, Eye, EyeOff, Fingerprint, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red:       #c0392b;
      --red-hi:    #e74c3c;
      --red-dim:   rgba(192, 57, 43, 0.15);
      --ink:       #050505;
      --smoke:     #111113;
      --ash:       #1c1c1f;
      --slate:     #a0a0aa;
      --pale:      #e0e0e8;
      --white:     #f4f4fa;

      --glass:     rgba(255, 255, 255, 0.04);
      --border:    rgba(255, 255, 255, 0.08);
      --focus-bg:  rgba(192, 57, 43, 0.06);
    }

    .account-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      position: relative;
    }

    .account-page::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'%3E%3C/svg%3E");
      opacity: 0.03;
    }

    .qs-display   { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.05); }
    }
    .bg-glow-anim {
      animation: pulse-glow 8s infinite ease-in-out;
    }

    .account-panel {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
    }

    .account-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: var(--white);
      padding: 12px 15px;
      outline: none;
      font-weight: 400;
      font-size: 1rem;
      transition: all 0.3s ease;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .account-input:focus {
      border-color: var(--red);
      background: var(--focus-bg);
      box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
    }
    .account-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .field-label {
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      color: var(--slate);
      text-transform: uppercase;
      font-weight: 600;
    }

    .field-value {
      font-size: 1.28rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      color: var(--white);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .field-caption {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--slate);
      margin-bottom: 0.24rem;
      font-weight: 600;
    }

    .field-caption-row {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--slate);
      font-weight: 600;
    }

    .info-block {
      background: rgba(255, 255, 255, 0.03);
      padding: 0.95rem 1.2rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
    }
    .info-block p {
      font-size: 1.23rem;
      font-weight: 400;
      color: var(--pale);
      line-height: 1.5;
    }

    .field-value-container {
      position: relative;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.66rem 0.85rem;
      transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      overflow: hidden;
    }
    .field-value-container.is-editing {
      border-color: rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.03);
    }
    .field-value-container:focus-within {
      border-color: var(--red);
      background: var(--focus-bg);
      box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1);
    }
    .field-value-stack {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
      overflow: hidden;
    }
    .field-value-container .field-value {
      grid-area: 1 / 1;
    }
    .field-value-container input {
      grid-area: 1 / 1;
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: var(--white);
      font-size: 1.28rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      line-height: 1.3;
      padding: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .field-value-container input.is-code {
      text-align: center;
      letter-spacing: 0.5em;
      font-size: 1.05rem;
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   ANIMATION CONFIGS
───────────────────────────────────────────── */
const fadeVariant = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.1, ease: "easeIn" } }
};

const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }
};

const fieldCrossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }
};

/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────────── */

const AutoHeight = ({ children, className = "" }) => {
  const innerRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    setHeight(node.getBoundingClientRect().height);
    const frame = requestAnimationFrame(() => setReady(true));

    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.height;
      if (typeof next === "number") setHeight(next);
    });
    ro.observe(node);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      style={{
        height,
        overflow: "hidden",
        transition: ready ? "height 0.22s cubic-bezier(0.65, 0, 0.35, 1)" : "none",
      }}
      className={className}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
};

const EditableField = ({ label, name, type = "text", value, onChange, isEditing, displayValue, autoFocus, maxLength, isCode }) => (
  <div className="relative">
    <p className="field-caption">{label}</p>
    <div className={`field-value-container group relative ${isEditing ? "is-editing" : ""}`}>
      <div className="field-value-stack">
        <AnimatePresence initial={false}>
          {isEditing ? (
            <motion.input
              key="input"
              name={name}
              type={type}
              required
              autoFocus={autoFocus}
              value={value}
              onChange={onChange}
              maxLength={maxLength}
              className={isCode ? "is-code" : ""}
              variants={fieldCrossfade}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ gridArea: "1 / 1" }}
            />
          ) : (
            <motion.p
              key="text"
              className="field-value"
              variants={fieldCrossfade}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ gridArea: "1 / 1" }}
              title={displayValue}
            >
              {displayValue}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);

const FormInput = ({ label, name, type = "text", value, onChange, disabled, autoFocus, maxLength, showPasswordToggle, isPasswordVisible, onTogglePassword, children }) => (
  <div className="relative group">
    <div className="flex justify-between items-center mb-1.5">
      <label className="field-caption-row group-focus-within:text-[var(--white)] transition-colors">
        {label}
      </label>
      {children}
    </div>
    <div className="relative">
      <input
        name={name}
        type={showPasswordToggle ? (isPasswordVisible ? "text" : "password") : type}
        required
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        className={`account-input ${showPasswordToggle ? "pr-12" : ""} ${maxLength ? "text-center tracking-[0.5em] text-xl" : "tracking-wider"}`}
        title={value}
      />
      {showPasswordToggle && (
        <button type="button" onClick={onTogglePassword} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none">
          {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   CHARACTER LIMITS (hidden, no visual indicators)
───────────────────────────────────────────── */
const CHAR_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 254,
  verificationCode: 6,
  currentPassword: 128,
  newPassword: 128,
  confirmPassword: 128,
  forgotCode: 6,
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const MyAccountPage = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "" });
  const [editMode, setEditMode] = useState({ name: false, email: false });
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [pwdMode, setPwdMode] = useState("IDLE");
  const [pwdFormData, setPwdFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [isMounted, setIsMounted] = useState(false);

  const leftColumnRef = useRef(null);
  const [securityMinHeight, setSecurityMinHeight] = useState(null);
  const measureTimeoutRef = useRef(null);
  const initialMeasurementDone = useRef(false);

  const measureLeftColumn = () => {
    if (leftColumnRef.current) {
      const h = leftColumnRef.current.getBoundingClientRect().height;
      if (h > 0) setSecurityMinHeight(h);
    }
  };

  const { data: userInfo } = useQuery(ME_QUERY, { fetchPolicy: "network-only" });

  const [requestEmailUpdate] = useMutation(REQUEST_EMAIL_UPDATE);
  const [confirmEmailUpdate] = useMutation(CONFIRM_EMAIL_UPDATE);
  const [updateName] = useMutation(UPDATE_NAME);

  const [updatePassword] = useMutation(UPDATE_PASSWORD);
  const [addPassword] = useMutation(ADD_PASSWORD);
  const [forgotPassword] = useMutation(FORGOT_PASSWORD);
  const [verifyResetCode] = useMutation(VERIFY_RESET_CODE);
  const [resetPassword] = useMutation(RESET_PASSWORD);

  useEffect(() => {
    setIsMounted(true);
    const u = userInfo?.me || {};
    if (u) {
      setUser(u);
      setFormData({ firstName: u.firstName, lastName: u.lastName, email: u.email });
    }
  }, [userInfo]);

  useEffect(() => {
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [pwdMode]);

  // Початкове вимірювання висоти
  useEffect(() => {
    if (!isMounted) return;

    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }

    measureTimeoutRef.current = setTimeout(() => {
      if (!editMode.name && !editMode.email) {
        measureLeftColumn();
        initialMeasurementDone.current = true;
      }
    }, 300);

    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
    };
  }, [isMounted, user.email]);

  // Оновлення висоти тільки коли обидві форми закриті і початкове вимірювання вже зроблено
  useEffect(() => {
    if (!initialMeasurementDone.current) return;

    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }

    // Оновлюємо тільки коли обидві форми в стані спокою
    if (!editMode.name && !editMode.email) {
      measureTimeoutRef.current = setTimeout(() => {
        measureLeftColumn();
      }, 400);
    }

    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
    };
  }, [editMode.name, editMode.email]);

  // Перевимірюємо при зміні розміру вікна
  useEffect(() => {
    let timer = null;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!editMode.name && !editMode.email) {
          measureLeftColumn();
        }
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [editMode.name, editMode.email]);

  const showSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  };

  const toggleEditMode = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
    if (!editMode[field]) {
      setFormData((prev) => ({
        ...prev,
        [field === "name" ? "firstName" : "email"]: field === "name" ? user.firstName : user.email,
        [field === "name" ? "lastName" : ""]: field === "name" ? user.lastName : "",
      }));
      if (field === "email") {
        setAwaitingCode(false);
        setVerificationCode("");
      }
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateName({
        variables: { input: { firstName: formData.firstName, lastName: formData.lastName } },
      });
      if (data.updateName) {
        setUser(prev => ({ ...data.updateName, hasPassword: prev.hasPassword }));
        toggleEditMode("name");
        showSnackbar("Identity updated successfully.");
      }
    } catch (err) {
      setFormData({ ...formData, firstName: user.firstName, lastName: user.lastName });
      showSnackbar("Failed to update identity.");
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await requestEmailUpdate({ variables: { newEmail: formData.email } });
      if (data.requestEmailUpdate) {
        setAwaitingCode(true);
        showSnackbar("Secure code sent to your NEW email.");
      }
    } catch (err) {
      if (err.message.includes("in use")) showSnackbar("Email is already registered to another agent.");
      else showSnackbar("Override failed. Please try again.");
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await confirmEmailUpdate({ variables: { token: verificationCode } });
      if (data.confirmEmailUpdate) {
        setUser(prev => ({ ...data.confirmEmailUpdate, hasPassword: prev.hasPassword }));
        toggleEditMode("email");
        showSnackbar("Communication channel updated.");
      }
    } catch (err) {
      showSnackbar("Invalid or expired authorization code.");
    }
  };

  const handleCommsSubmit = (e) => {
    if (awaitingCode) return handleCodeSubmit(e);
    return handleEmailSubmit(e);
  };

  const isNameChanged = formData.firstName !== user.firstName || formData.lastName !== user.lastName;
  const isEmailChanged = formData.email !== user.email;

  const handlePwdInputChange = (e) => {
    const { name, value } = e.target;
    setPwdFormData({ ...pwdFormData, [name]: value });
  };

  const handlePwdBack = () => {
    setPwdMode("IDLE");
    setPwdFormData({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
  };

  const validatePasswords = () => {
    if (pwdFormData.newPassword !== pwdFormData.confirmPassword) {
      showSnackbar("Passwords don't match. Please try again.");
      return false;
    }
    if (pwdFormData.newPassword.length < 8) {
      showSnackbar("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handlePwdChangeSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    try {
      await updatePassword({
        variables: { currentPassword: pwdFormData.currentPassword, newPassword: pwdFormData.newPassword },
      });
      showSnackbar("Password updated successfully!");
      handlePwdBack();
    } catch (err) {
      showSnackbar(err.message || "Failed to update password.");
    }
  };

  const handlePwdAddSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    try {
      await addPassword({ variables: { newPassword: pwdFormData.newPassword } });
      setUser(prev => ({ ...prev, hasPassword: true }));
      showSnackbar("Local password created successfully!");
      handlePwdBack();
    } catch (err) {
      showSnackbar(err.message || "Failed to add password.");
    }
  };

  const handlePwdForgotClick = async () => {
    if (!user.email) return;
    try {
      await forgotPassword({ variables: { email: user.email } });
      showSnackbar("Verification code sent to your email!");
      setPwdMode("FORGOT_CODE");
    } catch (err) {
      showSnackbar("Failed to send reset code. Try again.");
    }
  };

  const handlePwdForgotCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyResetCode({ variables: { email: user.email, code: pwdFormData.code } });
      showSnackbar("Code verified! Set your new password.");
      setPwdMode("FORGOT_RESET");
    } catch (err) {
      showSnackbar(err.message || "Invalid or expired code.");
    }
  };

  const handlePwdForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    try {
      await resetPassword({
        variables: { email: user.email, code: pwdFormData.code, newPassword: pwdFormData.newPassword },
      });
      setUser(prev => ({ ...prev, hasPassword: true }));
      showSnackbar("Password reset successful!");
      handlePwdBack();
    } catch (err) {
      showSnackbar(err.message || "Failed to reset password.");
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="account-page pb-20">
        <div
          className="absolute top-0 left-1/2 w-[80vw] h-[60vh] rounded-full pointer-events-none z-0 bg-glow-anim"
          style={{ background: "radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 60%)", filter: "blur(60px)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isMounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.39 }}
            className="mb-12 text-center md:text-left"
          >
            <div className="mb-4">
              <span className="qs-condensed text-[var(--red)] tracking-[0.2em] font-bold text-sm uppercase">Agent Profile</span>
            </div>
            <h1 className="qs-display text-3xl md:text-4xl lg:text-5xl leading-none text-[var(--white)] uppercase">
              {user.firstName ? `${user.firstName} ${user.lastName}` : "CLASSIFIED"}
            </h1>
            <div className="w-24 h-1 bg-[var(--red)] mt-4 mb-6 mx-auto md:mx-0" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            <div ref={leftColumnRef} className="lg:col-span-7 flex flex-col gap-6">

              {/* ── IDENTITY PANEL ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isMounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.13, duration: 0.325 }}
                className="account-panel p-6 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)]">
                      <Fingerprint size={20} className="text-[var(--red)]" />
                    </div>
                    <h2 className="qs-condensed text-[1.4rem] font-bold tracking-widest uppercase text-[var(--white)] leading-none">Identity Data</h2>
                  </div>
                  <AnimatePresence initial={false}>
                    {!editMode.name && (
                      <motion.button
                        key="edit-name-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => toggleEditMode("name")}
                        className="text-[var(--slate)] hover:text-[var(--red)] transition-colors p-2 focus:outline-none"
                      >
                        <Edit2 size={22} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleNameSubmit} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <EditableField
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      isEditing={editMode.name}
                      displayValue={user.firstName}
                      autoFocus={editMode.name}
                      maxLength={CHAR_LIMITS.firstName}
                    />
                    <EditableField
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      isEditing={editMode.name}
                      displayValue={user.lastName}
                      maxLength={CHAR_LIMITS.lastName}
                    />
                  </div>

                  <AutoHeight>
                    <AnimatePresence initial={false}>
                      {editMode.name && (
                        <motion.div
                          key="name-actions"
                          variants={fadeOnly}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="flex gap-3 pt-1"
                        >
                          <button type="submit" disabled={!isNameChanged} className="flex-1 bg-[var(--red)] text-white py-3.5 border border-[var(--red-hi)] flex items-center justify-center gap-2 qs-condensed tracking-widest uppercase font-bold text-base hover:bg-[var(--red-hi)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            <Check size={18} /> Save Data
                          </button>
                          <button type="button" onClick={() => toggleEditMode("name")} className="px-5 border border-[var(--border)] text-[var(--slate)] hover:text-[var(--white)] hover:border-[var(--slate)] flex items-center justify-center transition-all focus:outline-none rounded">
                            <X size={20} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AutoHeight>
                </form>
              </motion.div>

              {/* ── COMMUNICATIONS PANEL ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isMounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.195, duration: 0.325 }}
                className="account-panel p-6 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)]">
                      <Radio size={20} className="text-[var(--red)]" />
                    </div>
                    <h2 className="qs-condensed text-[1.4rem] font-bold tracking-widest uppercase text-[var(--white)] leading-none">Communications</h2>
                  </div>
                  <AnimatePresence initial={false}>
                    {!editMode.email && (
                      <motion.button
                        key="edit-email-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => toggleEditMode("email")}
                        aria-label="Edit email"
                        className="text-[var(--slate)] hover:text-[var(--red)] transition-colors p-2 focus:outline-none"
                      >
                        <Edit2 size={22} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleCommsSubmit} className="flex flex-col gap-3.5">
                  <EditableField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isEditing={editMode.email && !awaitingCode}
                    displayValue={awaitingCode ? formData.email : user.email}
                    autoFocus={editMode.email}
                    maxLength={CHAR_LIMITS.email}
                  />

                  <AutoHeight>
                    <AnimatePresence mode="wait" initial={false}>
                      {editMode.email && !awaitingCode && (
                        <motion.div
                          key="email-actions"
                          variants={fadeOnly}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="flex gap-3 pt-1"
                        >
                          <button type="submit" disabled={!isEmailChanged} className="flex-1 bg-[var(--red)] text-white py-3.5 border border-[var(--red-hi)] flex items-center justify-center gap-2 qs-condensed tracking-widest uppercase font-bold text-base hover:bg-[var(--red-hi)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            Send Auth Code
                          </button>
                          <button type="button" onClick={() => toggleEditMode("email")} className="px-5 border border-[var(--border)] text-[var(--slate)] hover:text-[var(--white)] hover:border-[var(--slate)] flex items-center justify-center transition-all focus:outline-none rounded">
                            <X size={20} />
                          </button>
                        </motion.div>
                      )}

                      {editMode.email && awaitingCode && (
                        <motion.div
                          key="code-actions"
                          variants={fadeOnly}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="flex flex-col gap-3.5 p-3.5 mt-1 border border-[var(--red-dim)] bg-[rgba(192,57,43,0.06)] rounded"
                        >
                          <EditableField
                            label="Enter 6-Digit Code"
                            name="code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            isEditing={true}
                            displayValue={verificationCode}
                            autoFocus
                            maxLength={CHAR_LIMITS.verificationCode}
                            isCode
                          />
                          <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-[var(--red)] text-white py-3.5 flex items-center justify-center gap-2 qs-condensed tracking-widest uppercase font-bold text-base hover:bg-[var(--red-hi)] transition-all">
                              Verify & Save
                            </button>
                            <button type="button" onClick={() => toggleEditMode("email")} className="px-5 border border-[var(--border)] text-[var(--slate)] hover:text-[var(--white)] flex items-center justify-center transition-all focus:outline-none rounded">
                              <X size={20} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AutoHeight>
                </form>
              </motion.div>
            </div>

            {/* ── SECURITY PANEL ── */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isMounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.26, duration: 0.325 }}
                className="account-panel p-6 relative overflow-hidden transition-colors duration-500 flex flex-col"
                style={{
                  minHeight: securityMinHeight ? `${securityMinHeight}px` : undefined,
                }}
              >
                <AnimatePresence mode="wait">
                  {pwdMode === "IDLE" && (
                    <motion.div key="idle" variants={fadeVariant} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1">
                      <div>
                        <div className="flex items-center gap-4 mb-5">
                          <div className="flex items-center justify-center w-10 h-10 rounded bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)]">
                            <ShieldAlert size={20} className="text-[var(--red)]" />
                          </div>
                          <h2 className="qs-condensed text-[1.4rem] font-bold tracking-widest uppercase text-[var(--white)] leading-none">System Security</h2>
                        </div>

                        <div className="info-block mt-7">
                          <p>
                            {user.hasPassword
                              ? "Your account is secured with a custom authorization key. You can update it at any time to maintain protocol security."
                              : "You currently access the system via an external Google link. Generate a local authorization key to enable direct manual login."}
                          </p>
                        </div>
                      </div>

                      <button onClick={() => setPwdMode(user.hasPassword ? "CHANGE" : "ADD")} className="mt-auto relative z-10 flex items-center justify-between w-full bg-transparent border border-[var(--red)] text-[var(--white)] px-6 py-3.5 hover:bg-[rgba(192,57,43,0.1)] transition-all duration-300 group/btn rounded">
                        <span className="qs-condensed font-bold text-base tracking-[0.2em] uppercase text-[var(--red)] group-hover/btn:text-[var(--white)] transition-colors">
                          {user.hasPassword ? "Change Password" : "Add Local Password"}
                        </span>
                        <ArrowRight size={20} className="text-[var(--red)] group-hover/btn:text-[var(--white)] group-hover/btn:translate-x-1 transition-all" />
                      </button>
                    </motion.div>
                  )}

                  {pwdMode !== "IDLE" && (
                    <motion.div key="form-container" variants={fadeVariant} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1">

                      <div className="flex items-center gap-4 mb-6">
                        <button onClick={handlePwdBack} className="text-[var(--slate)] hover:text-[var(--white)] transition-colors p-1 focus:outline-none">
                          <ArrowLeft size={22} />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded bg-[rgba(192,57,43,0.1)] border border-[rgba(192,57,43,0.3)]">
                            <Lock size={16} className="text-[var(--red)]" />
                          </div>
                          <h2 className="qs-condensed text-[1.28rem] font-bold tracking-widest uppercase text-[var(--white)] leading-none">
                            {pwdMode === "CHANGE" ? "Change Password" : pwdMode === "ADD" ? "Add Password" : pwdMode === "FORGOT_CODE" ? "Verify Identity" : "Set New Key"}
                          </h2>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {pwdMode === "CHANGE" && (
                          <motion.form key="change-pwd" variants={fadeVariant} initial="initial" animate="animate" exit="exit" onSubmit={handlePwdChangeSubmit} className="flex flex-col gap-4 flex-1">
                            <FormInput label="Current Password" name="currentPassword" value={pwdFormData.currentPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showCurrentPassword} onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)} autoFocus maxLength={CHAR_LIMITS.currentPassword}>
                              <button type="button" onClick={handlePwdForgotClick} className="text-xs text-[var(--red)] hover:text-[var(--red-hi)] transition-colors font-bold tracking-widest uppercase focus:outline-none">
                                Forgot?
                              </button>
                            </FormInput>
                            <FormInput label="New Password" name="newPassword" value={pwdFormData.newPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showNewPassword} onTogglePassword={() => setShowNewPassword(!showNewPassword)} maxLength={CHAR_LIMITS.newPassword} />
                            <FormInput label="Confirm New Password" name="confirmPassword" value={pwdFormData.confirmPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} maxLength={CHAR_LIMITS.confirmPassword} />
                            <button type="submit" className="mt-auto flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-3.5 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group rounded">
                              <span className="qs-condensed font-bold text-base tracking-[0.2em] uppercase">Update Security</span>
                              <ShieldCheck size={20} className="group-hover:scale-110 transition-transform duration-300" />
                            </button>
                          </motion.form>
                        )}

                        {pwdMode === "ADD" && (
                          <motion.form key="add-pwd" variants={fadeVariant} initial="initial" animate="animate" exit="exit" onSubmit={handlePwdAddSubmit} className="flex flex-col gap-4 flex-1">
                            <FormInput label="New Password" name="newPassword" value={pwdFormData.newPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showNewPassword} onTogglePassword={() => setShowNewPassword(!showNewPassword)} autoFocus maxLength={CHAR_LIMITS.newPassword} />
                            <FormInput label="Confirm Password" name="confirmPassword" value={pwdFormData.confirmPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} maxLength={CHAR_LIMITS.confirmPassword} />
                            <button type="submit" className="mt-auto flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-3.5 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group rounded">
                              <span className="qs-condensed font-bold text-base tracking-[0.2em] uppercase">Save Credentials</span>
                              <ShieldCheck size={20} className="group-hover:scale-110 transition-transform duration-300" />
                            </button>
                          </motion.form>
                        )}

                        {pwdMode === "FORGOT_CODE" && (
                          <motion.form key="forgot-code" variants={fadeVariant} initial="initial" animate="animate" exit="exit" onSubmit={handlePwdForgotCodeSubmit} className="flex flex-col gap-5 flex-1">
                            <FormInput label="6-Digit Code" name="code" maxLength={CHAR_LIMITS.forgotCode} value={pwdFormData.code} onChange={handlePwdInputChange} autoFocus />
                            <button type="submit" className="mt-auto flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-3.5 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group rounded">
                              <span className="qs-condensed font-bold text-base tracking-[0.2em] uppercase">Verify Code</span>
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </button>
                          </motion.form>
                        )}

                        {pwdMode === "FORGOT_RESET" && (
                          <motion.form key="forgot-reset" variants={fadeVariant} initial="initial" animate="animate" exit="exit" onSubmit={handlePwdForgotResetSubmit} className="flex flex-col gap-4 flex-1">
                            <FormInput label="New Password" name="newPassword" value={pwdFormData.newPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showNewPassword} onTogglePassword={() => setShowNewPassword(!showNewPassword)} autoFocus maxLength={CHAR_LIMITS.newPassword} />
                            <FormInput label="Confirm New Password" name="confirmPassword" value={pwdFormData.confirmPassword} onChange={handlePwdInputChange} showPasswordToggle isPasswordVisible={showConfirmPassword} onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)} maxLength={CHAR_LIMITS.confirmPassword} />
                            <button type="submit" className="mt-auto flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-3.5 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group rounded">
                              <span className="qs-condensed font-bold text-base tracking-[0.2em] uppercase">Save & Authenticate</span>
                              <ShieldCheck size={20} className="group-hover:scale-110 transition-transform duration-300" />
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {snackbar.show && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-50">
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollToTop(MyAccountPage);
