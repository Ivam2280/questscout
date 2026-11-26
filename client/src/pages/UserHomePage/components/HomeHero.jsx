import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "../../../assets/welcomePageImages/quest-evidence-hero-clean.jpg";

export default function HomeHero({ firstName }) {
  return (
    <section className="qs-hero" aria-labelledby="home-hero-title">
      <motion.div
        className="qs-hero-art"
        initial={{ opacity: 0, x: 44, scale: 1.035 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        <img src={heroImage} alt="" />
      </motion.div>

      <div className="qs-hero-inner">
        <motion.div
          className="qs-hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="qs-hero-kicker qs-condensed">Welcome back, {firstName}</p>
          <h1 id="home-hero-title" className="qs-hero-title qs-display">
            Read the clues.
            <span>Beat the clock.</span>
          </h1>
          <p className="qs-hero-description">
            Hidden symbols, false trails, one way out. Choose a story, bring your
            team, and see what you notice before time runs out.
          </p>
          <div className="qs-hero-actions">
            <Link to="/escaperooms" className="home-primary-link">
              <Search size={18} aria-hidden="true" />
              <span>Find your quest</span>
            </Link>
            <Link to="/howtobook" className="qs-hero-secondary">
              How it works
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
