import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  UPDATE_PASSWORD,
  ADD_PASSWORD,
  FORGOT_PASSWORD,
  VERIFY_RESET_CODE,
  RESET_PASSWORD
} from "../../utils/mutations";
import { ME_QUERY } from "../../utils/queries";
import Auth from "../../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SnackBar from "../SnackBarComponent/SnackBar";
import { Lock, Key, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES (Tech-Noir)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red:      #c0392b;
      --red-hi:   #e74c3c;
      --red-dim:  rgba(192, 57, 43, 0.15);
      --ink:      #050505;
      --ash:      #1c1c1f;
      --fog:      #2a2a2f;
      --slate:    #8a8a96;
      --pale:     #d6d6e0;
      --white:    #f0f0f5;
      --glass:    rgba(255, 255, 255, 0.02);
      --border:   rgba(255, 255, 255, 0.08);
    }

    .pwd-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .pwd-page::before {
      content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    .qs-display   { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
    }
    .bg-glow-anim {
      animation: pulse-glow 8s infinite ease-in-out;
    }

    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
  `}</style>
);

const ChangePassword = () => {
  const navigate = useNavigate();
  // Режими: LOADING, ADD, CHANGE, FORGOT_CODE, FORGOT_RESET
  const [mode, setMode] = useState("LOADING");
  const { data: userInfo, loading: meLoading } = useQuery(ME_QUERY, {
    skip: !Auth.loggedIn(),
    fetchPolicy: "network-only"
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    code: ""
  });

  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [isMounted, setIsMounted] = useState(false);

  const [updatePassword] = useMutation(UPDATE_PASSWORD);
  const [addPassword] = useMutation(ADD_PASSWORD);
  const [forgotPassword] = useMutation(FORGOT_PASSWORD);
  const [verifyResetCode] = useMutation(VERIFY_RESET_CODE);
  const [resetPassword] = useMutation(RESET_PASSWORD);

  useEffect(() => {
    setIsMounted(true);
    if (!meLoading && userInfo?.me) {
      setMode(userInfo.me.hasPassword ? "CHANGE" : "ADD");
    }
  }, [meLoading, userInfo]);

  const showSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validatePasswords = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      showSnackbar("Passwords don't match. Please try again.");
      return false;
    }
    if (formData.newPassword.length < 8) {
      showSnackbar("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleBack = () => {
    setMode("CHANGE");
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
  };

  // ─── 1. ЗМІНА ПАРОЛЯ (ЯКЩО ПАРОЛЬ ВЖЕ Є) ──────────────────────────
  const handleChangeSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    try {
      await updatePassword({
        variables: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
      });
      showSnackbar("Password updated successfully!");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
      setTimeout(() => navigate("/myaccount"), 1500);
    } catch (err) {
      showSnackbar(err.message || "Failed to update password.");
    }
  };

  // ─── 2. ДОДАВАННЯ ПАРОЛЯ (ПІСЛЯ GOOGLE АВТОРИЗАЦІЇ) ───────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    try {
      await addPassword({
        variables: { newPassword: formData.newPassword },
      });
      showSnackbar("Password created successfully!");
      setMode("CHANGE");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
      setTimeout(() => navigate("/myaccount"), 1500);
    } catch (err) {
      showSnackbar(err.message || "Failed to add password.");
    }
  };

  // ─── 3. ЗАБУВ ПАРОЛЬ: ВІДПРАВКА КОДУ ──────────────────────────────
  const handleForgotClick = async () => {
    if (!userInfo?.me?.email) return;
    try {
      await forgotPassword({ variables: { email: userInfo.me.email } });
      showSnackbar("Verification code sent to your email!");
      setMode("FORGOT_CODE");
    } catch (err) {
      showSnackbar("Failed to send reset code. Try again.");
    }
  };

  // ─── 4. ЗАБУВ ПАРОЛЬ: ПЕРЕВІРКА КОДУ ──────────────────────────────
  const handleForgotCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyResetCode({
        variables: { email: userInfo.me.email, code: formData.code },
      });
      showSnackbar("Code verified! Set your new password.");
      setMode("FORGOT_RESET");
    } catch (err) {
      showSnackbar(err.message || "Invalid or expired code.");
    }
  };

  // ─── 5. ЗАБУВ ПАРОЛЬ: ВСТАНОВЛЕННЯ НОВОГО ПАРОЛЯ ──────────────────
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    try {
      await resetPassword({
        variables: {
          email: userInfo.me.email,
          code: formData.code,
          newPassword: formData.newPassword
        },
      });
      showSnackbar("Password reset successful!");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "", code: "" });
      setTimeout(() => navigate("/myaccount"), 1500);
    } catch (err) {
      showSnackbar(err.message || "Failed to reset password.");
    }
  };

  if (mode === "LOADING") return null;

  let title = "Change Password";
  let subtitle = "Update your security credentials.";
  if (mode === "ADD") {
    title = "Add Password";
    subtitle = "Create a local password for your account.";
  } else if (mode === "FORGOT_CODE") {
    title = "Verify Identity";
    subtitle = `Enter the 6-digit code sent to ${userInfo?.me?.email}`;
  } else if (mode === "FORGOT_RESET") {
    title = "Set New Key";
    subtitle = "Identity verified. Establish your new password.";
  }

  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <>
      <GlobalStyles />
      <div className="pwd-page">
        {/* Анімований фон */}
        <div
          className="absolute top-1/2 left-1/2 w-[80vw] h-[80vh] rounded-full pointer-events-none z-0 bg-glow-anim"
          style={{ background: "radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 60%)", filter: "blur(60px)" }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg relative z-10 -mt-16 md:-mt-24"
        >
          {/* Return to Account Button */}
          <div className="mb-6 flex justify-start">
            <Link to="/myaccount" className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[var(--slate)] hover:text-[var(--white)] transition-colors">
              <ArrowLeft size={14} /> Back to Account
            </Link>
          </div>

          <div className="bg-[var(--glass)] border border-[var(--border)] rounded-lg backdrop-blur-xl p-8 md:p-12 relative overflow-hidden shadow-2xl min-h-[500px] flex flex-col">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            <div className="relative z-10 text-center mb-8">
              <h1 className="qs-display text-4xl lg:text-5xl text-[var(--white)] mb-2 uppercase tracking-wide">
                {title}
              </h1>
              <div className="w-12 h-1 bg-[var(--red)] mx-auto mb-4" />
              <p className="text-sm text-[var(--slate)]">
                {subtitle}
              </p>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">

                {/* ── ФОРМА ЗМІНИ ПАРОЛЯ ──────────────────────────────── */}
                {mode === "CHANGE" && (
                  <motion.form key="change" variants={slideVariants} initial="hidden" animate="show" exit="exit" onSubmit={handleChangeSubmit} className="flex flex-col gap-6">
                    <div className="relative group">
                      <div className="flex justify-between items-center mb-2">
                        <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] group-focus-within:text-[var(--pale)] transition-colors">
                          <Lock size={14} /> Current Password
                        </label>
                        <button type="button" onClick={handleForgotClick} className="text-[12px] text-[var(--red)] hover:text-[var(--red-hi)] transition-colors font-light">
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input name="currentPassword" type="password" required value={formData.currentPassword} onChange={handleInputChange} autoFocus
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> New Password
                      </label>
                      <div className="relative">
                        <input name="newPassword" type="password" required value={formData.newPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> Confirm New Password
                      </label>
                      <div className="relative">
                        <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <button type="submit" className="mt-2 flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-4 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group overflow-hidden relative">
                      <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">Update Credentials</span>
                      <ShieldCheck size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>
                  </motion.form>
                )}

                {/* ── ФОРМА ДОДАВАННЯ ПАРОЛЯ ──────────────────────────── */}
                {mode === "ADD" && (
                  <motion.form key="add" variants={slideVariants} initial="hidden" animate="show" exit="exit" onSubmit={handleAddSubmit} className="flex flex-col gap-6">
                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> New Password
                      </label>
                      <div className="relative">
                        <input name="newPassword" type="password" required autoFocus value={formData.newPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> Confirm Password
                      </label>
                      <div className="relative">
                        <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <button type="submit" className="mt-2 flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-4 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group overflow-hidden relative">
                      <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">Initialize Security</span>
                      <ShieldCheck size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>
                  </motion.form>
                )}

                {/* ── ФОРМА ВВЕДЕННЯ КОДУ ВІДНОВЛЕННЯ ─────────────────── */}
                {mode === "FORGOT_CODE" && (
                  <motion.form key="code" variants={slideVariants} initial="hidden" animate="show" exit="exit" onSubmit={handleForgotCodeSubmit} className="flex flex-col gap-6">
                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Key size={14} /> 6-Digit Code
                      </label>
                      <div className="relative">
                        <input name="code" type="text" maxLength="6" required autoFocus value={formData.code} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-4 text-center tracking-[0.5em] text-xl outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <button type="submit" className="mt-2 flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-4 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group overflow-hidden relative">
                      <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">Verify Code</span>
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>

                    <div className="text-center mt-2">
                      <button type="button" onClick={handleBack} className="text-[13px] text-[var(--slate)] hover:text-[var(--pale)] transition-colors flex items-center justify-center gap-2 w-full">
                        <ArrowLeft size={14} /> Abort & Return
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* ── ФОРМА ВСТАНОВЛЕННЯ НОВОГО ПАРОЛЯ ПІСЛЯ КОДУ ─────── */}
                {mode === "FORGOT_RESET" && (
                  <motion.form key="reset" variants={slideVariants} initial="hidden" animate="show" exit="exit" onSubmit={handleForgotResetSubmit} className="flex flex-col gap-6">
                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> New Password
                      </label>
                      <div className="relative">
                        <input name="newPassword" type="password" required autoFocus value={formData.newPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-2 group-focus-within:text-[var(--pale)] transition-colors">
                        <Lock size={14} /> Confirm New Password
                      </label>
                      <div className="relative">
                        <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange}
                          className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-3 outline-none focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest transition-all duration-300"
                        />
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                      </div>
                    </div>

                    <button type="submit" className="mt-2 flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-4 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] transition-all duration-300 group overflow-hidden relative">
                      <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">Save & Authenticate</span>
                      <ShieldCheck size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    </button>
                  </motion.form>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
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

export default ChangePassword;
