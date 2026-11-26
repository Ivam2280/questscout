import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import Auth from "../../utils/auth";
import SnackBar from "../../components/SnackBarComponent/SnackBar";
import {
  UserCheck,
  Target,
  Settings2,
  CreditCard,
  MapPin,
  ArrowRight,
  Fingerprint
} from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red:      #c0392b;
      --red-hi:   #e74c3c;
      --ink:      #050505;
      --border:   rgba(255, 255, 255, 0.08);
      --glass:    rgba(255, 255, 255, 0.04);
      --slate:    #b0b0bc;
      --pale:     #e8e8f0;
      --white:    #f8f8fc;
    }

    .htb-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    .htb-page::before {
      content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    .qs-display   { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.05); }
    }
    .bg-glow-anim { animation: pulse-glow 8s infinite ease-in-out; }
  `}</style>
);

const stepsData = [
  {
    step: "01",
    icon: <UserCheck size={36} />,
    title: "Authorization",
    desc: "Create an agent profile or log in to secure your identity and track mission history.",
  },
  {
    step: "02",
    icon: <Target size={36} />,
    title: "Select Mission",
    desc: "Browse our active quest rooms. Find the perfect scenario based on genre and difficulty.",
  },
  {
    step: "03",
    icon: <Settings2 size={36} />,
    title: "Configuration",
    desc: "Set your parameters: choose your squad size, pick a date, and lock in a time slot.",
  },
  {
    step: "04",
    icon: <CreditCard size={36} />,
    title: "Payment",
    desc: "Finalize your operation with a secure transaction to receive your mission briefing.",
  },
  {
    step: "05",
    icon: <MapPin size={36} />,
    title: "Report to HQ",
    desc: "Arrive 15 minutes early at the designated coordinates for orientation and deployment.",
  },
];

// Оптимізовані варіанти анімації (на 30% швидше)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.105, // Було 0.15, зменшено на 30%
      delayChildren: 0.14 // Було 0.2, зменшено на 30%
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35, // Було 0.5, зменшено на 30%
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

// Оптимізовані варіанти для хедера
const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42, // Було 0.6, зменшено на 30%
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

// Оптимізовані варіанти для CTA
const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.7, // Було 1.0, зменшено на 30%
      duration: 0.42, // Було 0.6, зменшено на 30%
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const HowToBookPage = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  const showSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: "" }), 3000);
  };

  const handleAuthClick = (e) => {
    if (Auth.loggedIn()) {
      e.preventDefault();
      showSnackbar("You are already authorized, Agent.");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="htb-page pt-8 pb-16 px-6 lg:px-12 relative z-10 flex flex-col items-center justify-start">
        <div
          className="absolute top-0 left-1/2 w-[90vw] h-[70vh] rounded-full pointer-events-none z-[-1] bg-glow-anim"
          style={{ background: "radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 60%)", filter: "blur(80px)", transform: "translate(-50%, 0)" }}
        />

        <div className="max-w-7xl w-full mx-auto">
          {/* ── Header ── */}
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="show"
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[var(--red)]" />
              <span className="qs-condensed text-[var(--red)] text-sm tracking-[0.25em] uppercase font-bold">
                Deployment Procedure
              </span>
              <div className="w-12 h-px bg-[var(--red)]" />
            </div>
            <h1 className="qs-display text-5xl md:text-7xl text-[var(--white)] uppercase leading-none m-0">
              How to <span style={{ color: "transparent", WebkitTextStroke: "2px var(--red)" }}>Book</span>
            </h1>
          </motion.div>

          {/* Steps */}
          <div className="relative mb-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10"
            >
              {stepsData.map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-[var(--glass)] border border-[var(--border)] rounded-lg p-6 md:p-8 relative flex flex-col items-center text-center group hover:border-[var(--red-hi)] hover:bg-[rgba(192,57,43,0.1)] transition-colors duration-300"
                >
                  <div className="absolute -top-6 bg-[var(--ink)] border-2 border-[rgba(255,255,255,0.15)] w-12 h-12 rounded flex items-center justify-center font-['Bebas_Neue'] text-xl text-[var(--white)] group-hover:bg-[var(--red)] group-hover:text-white group-hover:border-[var(--red-hi)] transition-all duration-300">
                    {step.step}
                  </div>

                  <div className="mt-6 mb-5 text-[var(--red)] transition-colors duration-300">
                    {step.icon}
                  </div>

                  <h3 className="qs-condensed text-2xl text-[var(--white)] tracking-widest uppercase font-bold mb-3 whitespace-nowrap">
                    {step.title}
                  </h3>

                  <p className="text-[var(--pale)] text-base leading-relaxed font-light">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Full-width CTA Bar */}
          <motion.div
            variants={ctaVariants}
            initial="hidden"
            animate="show"
            className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-lg px-8 md:px-10 py-5 flex flex-col lg:flex-row items-center justify-between gap-6 backdrop-blur-md"
          >
            <div className="text-center lg:text-left">
              <h3 className="qs-condensed text-2xl text-[var(--white)] tracking-widest uppercase font-bold">
                Ready for <span className="text-[var(--red)]">Deployment?</span>
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
              <button
                onClick={handleAuthClick}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-transparent border border-[var(--slate)] text-[var(--slate)] hover:text-[var(--white)] hover:border-[var(--white)] transition-all duration-300 qs-condensed font-bold text-sm tracking-[0.2em] uppercase rounded"
              >
                <Fingerprint size={18} />
                Authorize
              </button>

              <Link
                to="/escaperooms"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--red)] text-white border border-[var(--red-hi)] shadow-[0_0_20px_rgba(192,57,43,0.2)] hover:bg-[var(--red-hi)] hover:shadow-[0_0_40px_rgba(231,76,60,0.4)] transition-all duration-300 group overflow-hidden relative rounded"
              >
                <span className="qs-condensed font-bold text-sm tracking-[0.2em] uppercase relative z-10">
                  Browse Quests
                </span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>
            </div>
          </motion.div>

          <style>{`
            @keyframes shimmer {
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      </div>

      <AnimatePresence>
        {snackbar.show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <SnackBar message={snackbar.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScrollToTop(HowToBookPage);
