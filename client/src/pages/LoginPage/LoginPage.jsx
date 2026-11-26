import LoginForm from "../../components/LoginForm/LoginForm";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
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
      --fog:      #2a2a2f;
      --slate:    #8a8a96;
      --pale:     #d6d6e0;
      --white:    #f0f0f5;

      --glass:    rgba(255, 255, 255, 0.02);
      --border:   rgba(255, 255, 255, 0.08);
    }

    .auth-page {
      font-family: 'DM Sans', sans-serif;
      background: var(--ink);
      color: var(--white);
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }

    /* Фонова сітка та шум */
    .auth-page::before {
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
  `}</style>
);

const LoginPage = () => {
  return (
    <>
      <GlobalStyles />
      <div className="auth-page flex items-center justify-center p-6 md:p-12">
        {/* Анімоване червоне світіння на фоні */}
        <div
          className="absolute top-1/2 left-1/2 w-[80vw] h-[80vh] rounded-full pointer-events-none z-0 bg-glow-anim"
          style={{
            background: "radial-gradient(circle, rgba(192,57,43,0.1) 0%, transparent 60%)",
            filter: "blur(60px)"
          }}
        />

        {/* Контейнер форми (піднято ще вище) */}
        <div className="relative z-10 w-full max-w-5xl -mt-24 md:-mt-32">
          <LoginForm />
        </div>
      </div>
    </>
  );
};

export default ScrollToTop(LoginPage);
