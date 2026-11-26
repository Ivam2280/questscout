import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CREATE_USER } from "../../utils/mutations";
import { useMutation } from "@apollo/client";
import Auth from "../../utils/auth";
import SnackBar from "../SnackBarComponent/SnackBar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Mail, ShieldCheck, Fingerprint, User } from "lucide-react";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [isMounted, setIsMounted] = useState(false);
  const [createUser] = useMutation(CREATE_USER);

  useEffect(() => { setIsMounted(true); }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.idToken, action: "signup" }),
      });

      const data = await res.json();
      if (data.token) {
        Auth.login(data.token);
      } else {
        showSnackbar(data.error || "Google registration failed");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Error during Google registration");
    }
  };

  const showSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "email" ? value.toLowerCase() : value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.firstName.length > 23 || formData.lastName.length > 23) {
        showSnackbar("First and last names must be less than 24 characters");
        return;
      }

      if (formData.password.length < 8) {
        showSnackbar("Password must be at least 8 characters long");
        return;
      }

      if (formData.confirmpassword !== formData.password) {
        showSnackbar("Passwords don't match. Please try again.");
        return;
      }

      const { data } = await createUser({
        variables: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        },
      });

      if (data?.createUser?.token) {
        Auth.login(data.createUser.token);
      }
    } catch (err) {
      console.error(err);
      showSnackbar(
        err.message === "Email is already in use."
          ? "This email is already in use"
          : "Something went wrong. Please try again."
      );
    }
  };

  // Варіанти анімацій
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col md:flex-row overflow-hidden rounded-lg border border-[var(--border)] shadow-2xl backdrop-blur-xl bg-[var(--glass)]"
    >
      {/* ── ЛІВА ПАНЕЛЬ (Брендінг) ─────────────────────────────────────── */}
      <div className="relative hidden md:flex flex-col justify-between w-5/12 p-10 lg:p-14 bg-gradient-to-br from-[var(--ash)] to-[var(--ink)] border-r border-[var(--border)] overflow-hidden">
        {/* Декоративна текстура */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        {/* Ефект сканера */}
        <motion.div
          className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-[rgba(192,57,43,0.05)] to-transparent pointer-events-none"
          animate={{ top: ['-20%', '120%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center gap-3 mb-10 lg:mb-12"
          >
            <ShieldCheck size={28} className="text-[var(--red)]" />
            <span className="qs-condensed text-[var(--red)] tracking-[0.2em] font-bold text-sm uppercase">Recruitment</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="qs-display text-5xl lg:text-6xl leading-[0.9] text-[var(--white)] mb-6"
          >
            NEW RECRUIT,<br />ENLIST NOW
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[var(--slate)] text-sm leading-relaxed max-w-[280px]"
          >
            Create your secure agent profile to book missions, track your escape history, and join the elite ranks of Quest Scout.
          </motion.p>
        </div>

        <div className="relative z-10">
          <div className="w-16 h-px bg-[var(--fog)] mb-4" />
          <div className="flex items-center gap-2 text-[var(--slate)]">
            <Fingerprint size={14} className="text-[var(--red)] opacity-70" />
            <span className="qs-condensed text-[10px] tracking-[0.3em] uppercase">
              Secure Channel • Establishing Link
            </span>
          </div>
        </div>
      </div>

      {/* ── ПРАВА ПАНЕЛЬ (Сама форма - оптимізована по висоті) ────────── */}
      <div className="w-full md:w-7/12 p-8 md:p-10 lg:py-12 lg:px-14 relative flex flex-col justify-center">
        {/* Мобільний заголовок */}
        <div className="md:hidden mb-8 text-center">
          <h2 className="qs-display text-4xl text-[var(--white)] mb-2">ENLISTMENT</h2>
          <div className="w-12 h-1 bg-[var(--red)] mx-auto" />
        </div>

        <div className="flex flex-col gap-5 max-w-sm mx-auto md:max-w-md md:mx-0 lg:ml-6">

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="flex items-center justify-between mb-1"
          >
            <h3 className="qs-condensed text-2xl lg:text-3xl font-bold tracking-widest uppercase text-[var(--pale)]">
              Sign Up
            </h3>
          </motion.div>

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate={isMounted ? "show" : "hidden"}
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-4" /* Зменшений gap для компенсації висоти */
          >
            {/* ROW 1: FIRST & LAST NAME */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div variants={itemVariants} className="relative group w-full">
                <label htmlFor="firstname" className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-1.5 group-focus-within:text-[var(--pale)] transition-colors">
                  <User size={13} /> First Name
                </label>
                <div className="relative">
                  <input
                    id="firstname"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    autoComplete="given-name"
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-[10px] outline-none transition-all duration-300 focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light text-sm"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="relative group w-full">
                <label htmlFor="lastname" className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-1.5 group-focus-within:text-[var(--pale)] transition-colors">
                  <User size={13} /> Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastname"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    autoComplete="family-name"
                    className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-[10px] outline-none transition-all duration-300 focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light text-sm"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
                </div>
              </motion.div>
            </div>

            {/* EMAIL */}
            <motion.div variants={itemVariants} className="relative group">
              <label htmlFor="email" className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-1.5 group-focus-within:text-[var(--pale)] transition-colors">
                <Mail size={13} /> Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-[10px] outline-none transition-all duration-300 focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light text-sm"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
              </div>
            </motion.div>

            {/* PASSWORD */}
            <motion.div variants={itemVariants} className="relative group">
              <label htmlFor="password" className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-1.5 group-focus-within:text-[var(--pale)] transition-colors">
                <Lock size={13} /> Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-[10px] outline-none transition-all duration-300 focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest text-sm"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
              </div>
            </motion.div>

            {/* CONFIRM PASSWORD */}
            <motion.div variants={itemVariants} className="relative group">
              <label htmlFor="confirmpassword" className="qs-condensed flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[var(--slate)] mb-1.5 group-focus-within:text-[var(--pale)] transition-colors">
                <Lock size={13} /> Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmpassword"
                  name="confirmpassword"
                  type="password"
                  required
                  value={formData.confirmpassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] text-[var(--white)] px-4 py-[10px] outline-none transition-all duration-300 focus:border-[var(--red)] focus:bg-[rgba(192,57,43,0.03)] font-light tracking-widest text-sm"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--red)] transition-all duration-300 group-focus-within:w-full" />
              </div>
            </motion.div>

            {/* SUBMIT BUTTON */}
            <motion.div variants={itemVariants} className="mt-1">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center justify-between w-full bg-[var(--red)] text-white px-6 py-3.5 border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:shadow-[0_0_30px_rgba(231,76,60,0.4)] hover:bg-[var(--red-hi)] transition-all duration-300 cursor-pointer relative overflow-hidden group"
              >
                <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">Register Profile</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </motion.button>
            </motion.div>
          </motion.form>

          {/* DIVIDER */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4 mt-1"
          >
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="qs-condensed text-[10px] tracking-[0.2em] uppercase text-[var(--slate)]">Or bypass via</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </motion.div>

          {/* GOOGLE AUTH */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center w-full"
          >
            <GoogleSignInButton onCredential={handleGoogleResponse} onError={showSnackbar} signUp />
          </motion.div>

          {/* REDIRECT TO LOGIN */}
          <motion.div
            variants={itemVariants}
            className="mt-1 text-center"
          >
            <p className="text-[13px] text-[var(--slate)]">
              Already have an account?{" "}
              <Link to="/login" className="text-[var(--pale)] hover:text-[var(--red)] transition-colors duration-300 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-px after:bottom-0 after:left-0 after:bg-[var(--red)] after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300 pb-1">
                Log In
              </Link>
            </p>
          </motion.div>

        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* SNACKBAR */}
      <AnimatePresence>
        {snackbar.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SignUpForm;
