"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";
import { MagicalDeleteEffect } from "./magical-delete-effect";

interface AnimatedTableRowProps {
  children: ReactNode;
  isDeleting?: boolean;
  onDeleteComplete?: () => void;
  delay?: number;
  layoutId?: string;
  isVisible?: boolean;
}

export function AnimatedTableRow({ 
  children, 
  isDeleting = false, 
  onDeleteComplete,
  delay = 0,
  layoutId,
  isVisible = true
}: AnimatedTableRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isDeleting && rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  }, [isDeleting]);

  const handleAnimationComplete = () => {
    onDeleteComplete?.();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isDeleting && isVisible && (
          <motion.tr
            ref={rowRef}
            layoutId={layoutId}
            className="relative border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: -10,
              transition: { duration: 0.2 }
            }}
            transition={{ 
              duration: 0.3, 
              delay,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
            layout
          >
            {children}
          </motion.tr>
        )}
      </AnimatePresence>

      {/* Magical effect rendered outside table structure */}
      {isDeleting && position && (
        <MagicalDeleteEffect
          isDeleting={isDeleting}
          onAnimationComplete={handleAnimationComplete}
          position={position}
        />
      )}
    </>
  );
}