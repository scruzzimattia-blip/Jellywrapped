import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const variants = {
  enter: (dir: number) => ({
    y: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.96,
  }),
  center: { y: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    y: dir < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.02,
  }),
};

export function SlideMotion(props: {
  slideKey: string;
  direction: number;
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  const { slideKey, direction, children, className = '' } = props;

  return (
    <motion.div
      key={slideKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute inset-0 flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
}
