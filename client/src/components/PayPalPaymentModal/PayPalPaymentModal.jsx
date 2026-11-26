import { useRuntimeConfig } from "../../config";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CREATE_PAYPAL_ORDER, CAPTURE_PAYPAL_ORDER, COMPLETE_DEMO_PAYMENT } from "../../utils/mutations";
import { QUERY_SINGLEBOOKING } from "../../utils/queries";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, AlertCircle, CreditCard, ExternalLink } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────


// ─── Easing curves ────────────────────────────────────────────────────────────
const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1];
const EASE_IN_OUT    = [0.4, 0, 0.2, 1];

// ─── Project-style tokens (matches UserHomePage) ───────────────────────────────
const ModalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    .pm-scope {
      --red:    #c0392b;
      --red-hi: #e74c3c;
      --gold:   #d4a843;
      --ink:    #0a0a0b;
      --smoke:  #111113;
      --ash:    #1c1c1f;
      --fog:    #2a2a2f;
      --mist:   #3e3e45;
      --slate:  #8a8a96;
      --pale:   #d6d6e0;
      --white:  #f0f0f5;
      font-family: 'DM Sans', sans-serif;
    }
    .pm-display   { font-family: 'Bebas Neue', cursive; letter-spacing: 0.03em; }
    .pm-condensed { font-family: 'Barlow Condensed', sans-serif; }

    .pm-btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 12px;
      width: 100%;
      padding: 20px 36px;
      background: var(--red);
      color: white;
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 700; font-size: 18px;
      letter-spacing: 0.15em; text-transform: uppercase;
      border: 1px solid var(--red-hi);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 32px rgba(192, 57, 43, 0.35);
      border-radius: 4px;
    }
    .pm-btn-primary:hover {
      background: var(--red-hi);
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(231, 76, 60, 0.55);
    }
    .pm-btn-primary:disabled {
      opacity: 0.5; cursor: not-allowed; transform: none;
    }

    .pm-close-btn {
      color: var(--slate);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .pm-close-btn:hover { color: var(--white); }
    .pm-close-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `}</style>
);

// ─── Particles ────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 360;
  const rad   = (angle * Math.PI) / 180;
  const dist  = 62 + (i % 3) * 18;
  return {
    id:    i,
    tx:    Math.cos(rad) * dist,
    ty:    Math.sin(rad) * dist,
    color: i % 3 === 0 ? "#d4a843" : i % 3 === 1 ? "#c0392b" : "#e74c3c",
    size:  4 + (i % 4),
    delay: 0.1 + (i % 4) * 0.02,
  };
});

// ─── Success animation ────────────────────────────────────────────────────────
const SuccessAnimation = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", userSelect: "none" }}>
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, width: 128, height: 128 }}>
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          style={{ position: "absolute", borderRadius: "50%", width: p.size, height: p.size, backgroundColor: p.color, top: "50%", left: "50%", marginTop: -(p.size / 2), marginLeft: -(p.size / 2), willChange: "transform, opacity" }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: p.tx, y: p.ty, opacity: [0, 1, 0], scale: [0, 1.2, 0.8] }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: p.delay, opacity: { times: [0, 0.2, 1] } }}
        />
      ))}
      <motion.div
        style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(34,197,94,0.4)", willChange: "transform, opacity" }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 2.4, opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.18, opacity: { times: [0, 0.15, 1] } }}
      />
      <motion.div
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", willChange: "transform, opacity" }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.08 }}
      >
        <svg viewBox="0 0 24 24" width={64} height={64} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", willChange: "opacity" }}>
          <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.45, ease: EASE_IN_OUT, delay: 0.38 }} />
        </svg>
      </motion.div>
    </div>
    <motion.p className="pm-display" style={{ color: "var(--white)", fontSize: "2.4rem", lineHeight: 1, marginBottom: 12 }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.52 }}>
      Payment Successful
    </motion.p>
    <motion.p style={{ color: "var(--slate)", fontSize: 18 }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.6 }}>
      Your booking has been confirmed.
    </motion.p>
  </div>
);

const Row = ({ label, value, valueColor = "var(--white)", last = false }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingBottom: last ? 0 : 16, marginBottom: last ? 0 : 16, borderBottom: last ? "none" : "1px solid var(--fog)" }}>
    <span className="pm-condensed" style={{ color: "var(--slate)", fontSize: 16, textTransform: "uppercase", letterSpacing: "0.15em", flexShrink: 0 }}>{label}</span>
    <span style={{ fontWeight: 700, fontSize: 19, textAlign: "right", color: valueColor }}>{value}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PayPalPaymentModal = ({ amount, onClose, bookingId, bookingStatus, onViewDetails }) => {
  const features = useRuntimeConfig();
  const [isDemo, setIsDemo] = useState(!features.paypalClientId);
  const [completeDemoPayment] = useMutation(COMPLETE_DEMO_PAYMENT);
  const [sdkReady,        setSdkReady]        = useState(false);
  const [sdkError,        setSdkError]        = useState(false);
  const [paymentError,    setPaymentError]    = useState(null);
  const [isCapturing,     setIsCapturing]     = useState(false);
  const [buttonsRendered, setButtonsRendered] = useState(false);

  const [successStage, setSuccessStage] = useState(bookingStatus === "completed" ? "details" : null);

  const paypalContainerRef = useRef(null);
  const buttonsInstanceRef = useRef(null);
  const isMountedRef       = useRef(true);

  // GraphQL мутації
  const [createPayPalOrder] = useMutation(CREATE_PAYPAL_ORDER);
  const [capturePayPalOrder] = useMutation(CAPTURE_PAYPAL_ORDER);

  const { data: bookingData, refetch: refreshBooking } = useQuery(QUERY_SINGLEBOOKING, {
    variables: { booking_id: bookingId },
    skip: !bookingId,
  });

  const bookingDate = bookingData?.getSingleBooking?.date ?? "";
  const amountUSD   = (amount / features.paypalRate).toFixed(2);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return [
      d.getDate().toString().padStart(2, "0"),
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getFullYear(),
    ].join(".");
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Load PayPal SDK ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo || successStage) return;

    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      if (window.paypal) setSdkReady(true);
      else {
        const onLoad = () => { if (isMountedRef.current) setSdkReady(true); };
        existing.addEventListener("load", onLoad);
        return () => existing.removeEventListener("load", onLoad);
      }
      return;
    }

    const script   = document.createElement("script");
    script.id      = "paypal-sdk";
    script.src     = [
      "https://www.paypal.com/sdk/js",
      `?client-id=${features.paypalClientId}`,
      "&currency=USD",
      "&locale=en_US",
      "&intent=capture",
      "&commit=true",
      "&components=buttons",
      "&disable-funding=credit,card" // PayPal кнопка візьме на себе весь flow
    ].join("");
    script.async   = true;
    script.onload  = () => { if (isMountedRef.current) setSdkReady(true); };
    script.onerror = () => { if (isMountedRef.current) setSdkError(true); };
    document.body.appendChild(script);
  }, [successStage, isDemo]);

  // ── Render PayPal Buttons ───────────────────────────────────────────────────
  const renderButtons = useCallback(() => {
    if (isDemo || !window.paypal || !paypalContainerRef.current || buttonsRendered || successStage) return;
    setButtonsRendered(true);

    let buttons;
    try {
      buttons = window.paypal.Buttons({
        style: { layout: "vertical", color: "black", shape: "rect", label: "pay", tagline: false, height: 55 },

        // 1. СТВОРЕННЯ ОРДЕРУ НА БЕКЕНДІ
        createOrder: async () => {
          try {
            setPaymentError(null);
            const { data } = await createPayPalOrder({ variables: { booking_id: bookingId } });
            return data.createPayPalOrder; // Повертає ID ордера від нашого бекенду
          } catch (err) {
            const completed = err.graphQLErrors?.some((error) => error.extensions?.code === "PAYPAL_ALREADY_COMPLETED");
            if (completed) {
              await refreshBooking().catch(() => {});
              if (isMountedRef.current) setSuccessStage("animation");
            } else if (isMountedRef.current) {
              setPaymentError(err.graphQLErrors?.[0]?.message || "Could not initialize secure transaction.");
            }
            throw err;
          }
        },

        // 2. ЗАХОПЛЕННЯ ОРДЕРУ НА БЕКЕНДІ ПІСЛЯ ПІДТВЕРДЖЕННЯ
        onApprove: async (data, actions) => {
          if (!isMountedRef.current) return;
          try {
            setPaymentError(null);
            setIsCapturing(true);

            // Викликаємо наш бекенд, щоб він завершив оплату
            const result = await capturePayPalOrder({
              variables: {
                orderId: data.orderID,
                booking_id: bookingId,
              },
            });
            if (result.data?.capturePayPalOrder?.payment_status !== "completed") throw new Error("Payment is not completed.");
            if (isMountedRef.current) setSuccessStage("animation");
          } catch (err) {
            const declined = err.graphQLErrors?.some((error) => error.extensions?.paypalIssue === "INSTRUMENT_DECLINED");
            if (declined && actions?.restart) return actions.restart();
            if (isMountedRef.current) setPaymentError(err.graphQLErrors?.[0]?.message || "The sandbox payment could not be confirmed. Please check the booking before retrying.");
          } finally {
            if (isMountedRef.current) setIsCapturing(false);
          }
        },

        onCancel: () => {
          if (isMountedRef.current) setPaymentError("Payment was cancelled. You can try again.");
        },
        onError: (err) => {
          if (isMountedRef.current) setPaymentError((previous) => previous || "PayPal checkout could not be completed. Close the PayPal window and try again to start a new payment attempt.");
        },
      });
    } catch (err) {
      console.error("PayPal Buttons init error:", err);
      if (isMountedRef.current) setSdkError(true);
      return;
    }

    buttonsInstanceRef.current = buttons;

    try {
      if (buttons.isEligible()) Promise.resolve(buttons.render(paypalContainerRef.current)).catch(() => { if (isMountedRef.current) setSdkError(true); });
      else setSdkError(true);
    } catch (err) {
      console.error("PayPal render error:", err);
      if (isMountedRef.current) setSdkError(true);
    }
  }, [sdkReady, buttonsRendered, successStage, bookingId, amount, createPayPalOrder, capturePayPalOrder, refreshBooking, isDemo]);

  useEffect(() => {
    if (sdkReady) renderButtons();
  }, [sdkReady, renderButtons]);

  useEffect(() => {
    return () => {
      if (buttonsInstanceRef.current?.close) {
        try { buttonsInstanceRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  return (
    <>
      <ModalStyles />
      <motion.div
        className="pm-scope"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE_IN_OUT }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          style={{ width: "100%", maxWidth: 640, background: "var(--smoke)", border: "1px solid var(--fog)", borderRadius: 6, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", position: "relative", overflow: "hidden" }}
          initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none", backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: 140, background: "rgba(192,57,43,0.18)", filter: "blur(60px)", pointerEvents: "none" }} />

          {/* Header */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "32px 40px", borderBottom: "1px solid var(--fog)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ShieldCheck size={32} style={{ color: "var(--red)" }} />
              <div>
                <span className="pm-condensed" style={{ display: "block", color: "var(--red)", fontSize: 14, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>
                  {successStage ? "Transaction Complete" : "Payment Gateway"}
                </span>
                <h2 className="pm-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--white)", lineHeight: 1 }}>
                  {successStage ? "Payment Complete" : "Secure Checkout"}
                </h2>
              </div>
            </div>
            <button onClick={onClose} disabled={isCapturing} className="pm-close-btn" aria-label="Close modal">
              <X size={28} />
            </button>
          </div>

          <div style={{ position: "relative", zIndex: 1, padding: "36px 40px 44px" }}>
            {!successStage && features.paypalClientId && features.demoPayments && <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {[[false, "PayPal Sandbox"], [true, "Demo payment"]].map(([demo, label]) => <button key={label} type="button" disabled={isCapturing} onClick={() => {
                try { buttonsInstanceRef.current?.close(); } catch {}
                buttonsInstanceRef.current = null;
                setButtonsRendered(false); setPaymentError(null); setIsDemo(demo);
              }} style={{ flex: 1, padding: 12, cursor: "pointer", color: "var(--white)", background: isDemo === demo ? "var(--red)" : "var(--ash)", border: "1px solid var(--fog)", borderRadius: 4 }}>{label}</button>)}
            </div>}
            <AnimatePresence mode="wait">
              {successStage === "animation" && (
                <motion.div key="anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE_IN_OUT }}>
                  <SuccessAnimation />
                  <motion.button
                    onClick={() => setSuccessStage("details")}
                    className="pm-btn-primary"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.82 }}
                  >
                    <ExternalLink size={18} /> Payment Details
                  </motion.button>
                </motion.div>
              )}

              {successStage === "details" && (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}>
                  <div style={{ background: "var(--ash)", border: "1px solid var(--fog)", borderRadius: 4, padding: "28px 28px 20px", marginBottom: 28 }}>
                    <Row label="Booking ID" value={bookingId} />
                    <Row label="Amount Paid" value={`${amount} UAH`} valueColor="var(--red)" />
                    <Row label="Gateway" value={bookingData?.getSingleBooking?.payment_method || (isDemo ? "Demo" : "PayPal Sandbox")} />
                    <Row label="Status" value="COMPLETED" valueColor="#22c55e" />
                    {bookingDate && <Row label="Date" value={formatDate(bookingDate)} last />}
                  </div>
                  {onViewDetails && (
                    <button onClick={onViewDetails} className="pm-btn-primary">
                      <ExternalLink size={18} /> View Booking Details
                    </button>
                  )}
                </motion.div>
              )}

              {!successStage && (
                <motion.div key="checkout" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}>
                  <div style={{ background: "var(--ash)", border: "1px solid var(--fog)", borderRadius: 4, padding: 28, marginBottom: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                      <span className="pm-condensed" style={{ color: "var(--pale)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>Booking ID</span>
                      <span style={{ color: "var(--white)", fontFamily: "monospace", fontSize: 18 }}>{bookingId}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid var(--fog)", paddingTop: 20 }}>
                      <div>
                        <span className="pm-condensed" style={{ display: "block", color: "var(--pale)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 6 }}>Total Due</span>
                        <span style={{ display: "block", fontSize: 15, color: "var(--slate)" }}>{isDemo ? "Portfolio demo · no money is charged" : `Sandbox rate: 1 USD ≈ ${features.paypalRate} UAH`}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="pm-display" style={{ display: "block", fontSize: "2.2rem", color: "var(--red)", lineHeight: 1 }}>{amount} UAH</span>
                        {!isDemo && <span style={{ display: "block", fontSize: 17, color: "var(--pale)", marginTop: 4 }}>${amountUSD} USD</span>}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isCapturing && (
                      <motion.div key="capturing" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 20 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.3, ease: EASE_IN_OUT }} style={{ overflow: "hidden" }}>
                        <div style={{ padding: "16px 20px", background: "var(--ash)", border: "1px solid var(--mist)", borderRadius: 4, textAlign: "center" }}>
                          <motion.p className="pm-condensed" style={{ color: "var(--slate)", fontSize: 15, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700 }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>Processing secure payment…</motion.p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {paymentError && (
                      <motion.div key="error" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.3, ease: EASE_IN_OUT }} style={{ overflow: "hidden" }}>
                        <div style={{ padding: 18, background: "rgba(192,57,43,0.1)", border: "1px solid var(--red)", borderRadius: 4, display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <AlertCircle size={20} style={{ color: "var(--red-hi)", flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: 16, color: "var(--pale)", flex: 1 }}>{paymentError}</p>
                          <button onClick={() => setPaymentError(null)} className="pm-close-btn" aria-label="Dismiss error"><X size={16} /></button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isDemo ? (
                    <button className="pm-btn-primary" disabled={isCapturing} onClick={async () => {
                      setIsCapturing(true); setPaymentError(null);
                      try { await completeDemoPayment({ variables: { booking_id: bookingId } }); setSuccessStage("animation"); }
                      catch (error) { setPaymentError(error.message); }
                      finally { setIsCapturing(false); }
                    }}>{isCapturing ? "Processing…" : "Simulate payment"}</button>
                  ) : sdkError ? (
                    <div style={{ padding: "36px 0", textAlign: "center", background: "var(--ash)", border: "1px solid var(--fog)", borderRadius: 4 }}>
                      <p style={{ color: "var(--red-hi)", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Failed to load PayPal</p>
                      <p style={{ color: "var(--slate)", fontSize: 14 }}>Check your connection and reload the page.</p>
                    </div>
                  ) : !sdkReady ? (
                    <div style={{ padding: "36px 0", textAlign: "center" }}>
                      <motion.p className="pm-condensed" style={{ color: "var(--slate)", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 15, fontWeight: 700 }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>Establishing Secure Connection…</motion.p>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} style={isCapturing ? { pointerEvents: "none", opacity: 0.5 } : undefined} />
                  )}

                  <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--slate)" }}>
                    <CreditCard size={16} />
                    <span className="pm-condensed" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.2em" }}>{isDemo ? "Demo checkout · no real payment" : "PayPal Sandbox"}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default PayPalPaymentModal;
