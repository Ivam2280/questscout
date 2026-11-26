import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollToTop from "../../components/ScrollToTopWrapper/ScrollToTopWrapper";
import NavButtonComponent from "../../components/NavButtonComponent/NavButtonComponent";

const AboutUsPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-16 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 relative inline-block">
            <span className="relative z-10 underline decoration-orange-600">
              About QuestScout
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-orange-300 font-medium"
          >
            Where adventure meets puzzle-solving
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-8 md:p-10 shadow-lg border border-zinc-700/50"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-orange-400">
              Our Mission
            </h2>
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              At <span className="font-bold text-orange-400">QuestScout</span>,
              we create unforgettable quest room experiences that challenge the
              mind and spark the imagination. Each adventure is meticulously
              crafted to transport you to another world.
            </p>
            <p className="text-lg md:text-xl leading-relaxed">
              Whether you're defusing a bomb, solving an ancient mystery, or
              escaping a haunted mansion, you'll need teamwork, creativity, and
              quick thinking to succeed.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-8 md:p-10 shadow-lg border border-zinc-700/50"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-orange-400">
              The Experience
            </h2>
            <p className="text-lg md:text-xl leading-relaxed mb-6">
              Our rooms feature state-of-the-art technology, intricate puzzles,
              and immersive storytelling. Every detail is designed to create a
              completely believable environment that will challenge all your
              senses.
            </p>
            <p className="text-lg md:text-xl leading-relaxed">
              Perfect for team building, date nights, or just fun with friends,
              our experiences create memories that last long after you've
              escaped.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollToTop(AboutUsPage);
