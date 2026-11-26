import { useEffect, useRef } from "react";

const SnackBar = ({ message }) => {
  const snackbarRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const snackbar = snackbarRef.current;
    if (!snackbar || !message) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    snackbar.classList.remove("fade-out");
    snackbar.classList.add("fade-in");

    timeoutRef.current = setTimeout(() => {
      snackbar.classList.remove("fade-in");
      snackbar.classList.add("fade-out");

      timeoutRef.current = setTimeout(() => {
        snackbar.classList.remove("fade-out");
      }, 800);
    }, 2500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={snackbarRef}
      className="fixed top-6 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-lg font-medium max-w-md text-center z-50 fade-in
                 backdrop-blur-lg bg-orange-600/30 border border-orange-400/30 text-white
                 transition-all duration-300 hover:bg-orange-600/50 hover:border-orange-500/50"
    >
      {message}
      <style jsx global>{`
        @keyframes advancedFadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -40px) scale(0.8);
            backdrop-filter: blur(0px);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, 10px) scale(1.05);
            backdrop-filter: blur(10px);
          }
          100% {
            transform: translate(-50%, 0px) scale(1);
            backdrop-filter: blur(20px);
          }
        }

        @keyframes advancedFadeOut {
          0% {
            opacity: 1;
            transform: translate(-50%, 0px) scale(1);
            backdrop-filter: blur(20px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -30px) scale(0.95);
            backdrop-filter: blur(0px);
          }
        }

        .fade-in {
          animation: advancedFadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .fade-out {
          animation: advancedFadeOut 0.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SnackBar;
