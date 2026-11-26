import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import { Clock, ShieldAlert, PhoneOff, Ear, Ban, Unlock } from "lucide-react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    :root {
      --red:      #c0392b;
      --red-hi:   #e74c3c;
      --red-dim:  rgba(192, 57, 43, 0.15);
      --ink:      #050505;
      --smoke:    #111113;
      --ash:      #1c1c1f;
      --border:   rgba(255, 255, 255, 0.08);
      --glass:    rgba(255, 255, 255, 0.04);
      --slate:    #b0b0bc;
      --pale:     #e8e8f0;
      --white:    #f8f8fc;
    }

    .rules-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    .rules-page::before {
      content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      opacity: 0.03;
    }

    .qs-display   { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
    .qs-condensed { font-family: 'Barlow Condensed', sans-serif; }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.05); }
    }
    .bg-glow-anim {
      animation: pulse-glow 8s infinite ease-in-out;
    }

    .rule-card {
      background: var(--glass);
      border: 1px solid var(--border);
      padding: 2rem;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
    }

    .rule-card:hover {
      border-color: var(--red-hi);
      background: rgba(192, 57, 43, 0.1);
      box-shadow: 0 0 30px rgba(192, 57, 43, 0.15);
      transform: translateY(-4px);
    }

    .rule-card:hover .rule-icon {
      color: var(--red-hi);
      transform: scale(1.1);
      filter: drop-shadow(0 0 8px rgba(231, 76, 60, 0.5));
    }

    .rule-card:hover .rule-title {
      color: var(--white);
    }

    .rule-card:hover .rule-desc {
      color: var(--white);
    }

    .rule-icon {
      color: var(--red);
      flex-shrink: 0;
      transition: all 0.3s ease;
    }

    .rule-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.75rem;
      color: var(--white);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 700;
      transition: color 0.3s ease;
    }

    .rule-desc {
      color: var(--pale);
      font-size: 1rem;
      line-height: 1.6;
      font-weight: 300;
      transition: color 0.3s ease;
    }
  `}</style>
);

const rulesData = [
  {
    icon: <Clock size={32} />,
    title: "Arrive Early",
    desc: "Report to HQ 15 minutes prior to your scheduled deployment for the mission briefing. Late arrivals may have their time deducted.",
  },
  {
    icon: <ShieldAlert size={32} />,
    title: "No Force Required",
    desc: "Clues require brainpower, not muscle. If something is locked or secured, do not use physical force to pry it open.",
  },
  {
    icon: <PhoneOff size={32} />,
    title: "Comms Silence",
    desc: "Mobile phones, cameras, and external communication devices are strictly prohibited inside the mission zone.",
  },
  {
    icon: <Ear size={32} />,
    title: "Command Control",
    desc: "Listen carefully to your Game Master. They are your primary contact and will provide crucial intel if you get stuck.",
  },
  {
    icon: <Ban size={32} />,
    title: "Clear Minds",
    desc: "Agents under the influence of alcohol or narcotics will be denied entry. Sharp senses are required to survive.",
  },
  {
    icon: <Unlock size={32} />,
    title: "Emergency Exit",
    desc: "Your safety is paramount. Every room is equipped with an emergency panic button. You can abort the mission at any time.",
  },
];

const RulesPage = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.07,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      filter: "blur(4px)",
    },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <>
      <GlobalStyles />
      <div className="rules-page pt-8 pb-16 px-6 lg:px-12 relative z-10">
        <div
          className="absolute top-0 left-1/2 w-[80vw] h-[60vh] rounded-full pointer-events-none z-[-1] bg-glow-anim"
          style={{ background: "radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 60%)", filter: "blur(60px)", transform: "translateX(-50%)" }}
        />

        <div className="max-w-6xl mx-auto">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-px bg-[var(--red)]" />
              <span className="qs-condensed text-[var(--red)] text-sm tracking-[0.25em] uppercase font-bold">
                Operational Protocols
              </span>
              <div className="w-12 h-px bg-[var(--red)]" />
            </div>
            <h1 className="qs-display text-5xl md:text-7xl text-[var(--white)] uppercase leading-none m-0">
              Rules of <span style={{ color: "transparent", WebkitTextStroke: "2px var(--red)" }}>Engagement</span>
            </h1>
          </motion.div>

          {/* Картки */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rulesData.map((rule, index) => (
              <motion.div key={index} variants={itemVariants} className="rule-card group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="rule-icon">{rule.icon}</div>
                  <h3 className="rule-title">{rule.title}</h3>
                </div>
                <p className="rule-desc">{rule.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer Warning */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16 text-center border-t border-[var(--border)] pt-8"
          >
            <p className="qs-condensed text-[var(--white)] tracking-widest text-base uppercase font-bold">
              Violating these protocols may result in immediate mission termination without a refund.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ScrollToTop(RulesPage);
