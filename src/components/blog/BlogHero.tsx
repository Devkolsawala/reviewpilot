"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const firstLine = "Review Management Insights".split(" ");
const secondLine = "for Indian Businesses".split(" ");

const container: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const word: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function BlogHero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 pb-14 pt-24 sm:px-6 sm:pb-18 sm:pt-28 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl sm:h-96 sm:w-96"
      />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
          Field notes
        </p>
        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="mt-5 font-sans text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          <span className="block">
            {firstLine.map((item) => (
              <motion.span key={item} variants={word} className="mr-3 inline-block">
                {item}
              </motion.span>
            ))}
          </span>
          <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {secondLine.map((item) => (
              <motion.span key={item} variants={word} className="mr-3 inline-block">
                {item}
              </motion.span>
            ))}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg"
        >
          Practical guides on Google reviews, Play Store ratings, and WhatsApp
          automation &mdash; written for founders and operators.
        </motion.p>
      </div>
    </section>
  );
}
