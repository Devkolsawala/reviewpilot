"use client";

import { Children, cloneElement, isValidElement } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Page mount animation.
 *
 * Default: a single fade-up of the page subtree (200ms). This preserves the
 * page's outer layout (flex chains, height calc, etc.) — important for the
 * Inbox where the two-pane shell depends on `flex-1 min-h-0`.
 *
 * `stagger`: opt-in 50ms-stagger fade-up across the wrapper's direct children
 * — used on pages whose content is a vertical stack (`space-y-*`) where
 * inserting per-section motion boxes is layout-safe (Dashboard, Analytics,
 * Docs left column).
 *
 * prefers-reduced-motion (via framer's useReducedMotion) collapses both modes
 * to a no-op — content snaps in instantly.
 */

const STAGGER = 0.05;
const DURATION = 0.2;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: "easeOut" } },
};

const noMotion: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

type AnyElement = React.ReactElement<{ children?: React.ReactNode; className?: string }>;

function isSingleElement(children: React.ReactNode): children is AnyElement {
  const arr = Children.toArray(children);
  return arr.length === 1 && isValidElement(arr[0]);
}

interface PageTransitionProps {
  children: React.ReactNode;
  /** Stagger top-level sections of the wrapper child. Default false. */
  stagger?: boolean;
}

export function PageTransition({ children, stagger = false }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const sectionVariants = reduceMotion ? noMotion : fadeUp;

  if (stagger && isSingleElement(children)) {
    const wrapper = Children.toArray(children)[0] as AnyElement;
    const inner = Children.toArray(wrapper.props.children);
    const wrapped = inner.map((node, i) => (
      <motion.div key={i} variants={sectionVariants}>
        {node}
      </motion.div>
    ));
    return (
      <motion.div initial="hidden" animate="show" variants={container} className="contents">
        {cloneElement(wrapper, wrapper.props, wrapped)}
      </motion.div>
    );
  }

  // Default: single fade-up of the whole subtree, no layout interference.
  return (
    <motion.div initial="hidden" animate="show" variants={sectionVariants}>
      {children}
    </motion.div>
  );
}
