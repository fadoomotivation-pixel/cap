import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Scroll-driven depth primitives.
 *
 * These are tied to scroll position rather than fired once on entry, so on a
 * phone the page feels like it has layers you're moving through instead of
 * blocks that pop in. Everything collapses to a plain static render when the
 * visitor has asked for reduced motion.
 */

/** Card that tilts back and lifts as it travels up the viewport. */
export function TiltIn({ children, className = '', delay = 0, tilt = 9 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // 0 = card's top just entering from the bottom, 1 = card leaving the top
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [tilt, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [46, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.955, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);

  if (reduce) return <div ref={ref} className={className}>{children}</div>;

  return (
    <div ref={ref} style={{ perspective: 1000 }} className={className}>
      <motion.div
        style={{ rotateX, y, scale, opacity, transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Content that drifts at a different rate than the page — cheap parallax. */
export function Parallax({ children, className = '', distance = 60 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (reduce) return <div ref={ref} className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Heading/paragraph that rises into place as its section arrives. */
export function RiseIn({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
