"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { soundManager } from "@/lib/sound-manager";

interface SparkleProps {
  x: number;
  y: number;
  delay?: number;
}

function Sparkle({ x, y, delay = 0 }: SparkleProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      style={{ left: x, top: y }}
      initial={{ 
        scale: 0, 
        rotate: 0,
        opacity: 0 
      }}
      animate={{ 
        scale: [0, 1, 0], 
        rotate: [0, 180, 360],
        opacity: [0, 1, 0],
        x: [0, Math.random() * 60 - 30],
        y: [0, Math.random() * 60 - 30]
      }}
      transition={{ 
        duration: 0.8,
        delay,
        ease: "easeOut"
      }}
    >
      <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 rounded-full shadow-lg" 
           style={{ 
             boxShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 105, 180, 0.6)' 
           }} />
    </motion.div>
  );
}

interface MagicalDeleteEffectProps {
  isDeleting: boolean;
  onAnimationComplete?: () => void;
  position?: { top: number; left: number; width: number; height: number };
}

export function MagicalDeleteEffect({ isDeleting, onAnimationComplete, position }: MagicalDeleteEffectProps) {
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isDeleting) {
      // Play magical sound effect
      soundManager.playMagicalPoof();
      setTimeout(() => soundManager.playSparkle(), 200);

      // Generate random sparkle positions across the row
      const width = position?.width || 400;
      const height = position?.height || 80;
      
      const newSparkles: SparkleProps[] = Array.from({ length: 16 }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height + 10,
        delay: i * 0.04
      }));
      setSparkles(newSparkles);

      // Clean up after animation
      const timeout = setTimeout(() => {
        setSparkles([]);
        onAnimationComplete?.();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [isDeleting, onAnimationComplete, position]);

  if (!mounted || !isDeleting) return null;

  const effectStyle = position ? {
    position: 'fixed' as const,
    top: position.top,
    left: position.left,
    width: position.width,
    height: position.height,
    zIndex: 9999,
    pointerEvents: 'none' as const
  } : {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 10,
    pointerEvents: 'none' as const
  };

  const effectContent = (
    <AnimatePresence>
      <motion.div 
        className="overflow-hidden"
        style={effectStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {sparkles.map((sparkle, index) => (
          <Sparkle key={index} {...sparkle} />
        ))}
        
        {/* Magic circle expansion effect */}
        <motion.div
          className="absolute inset-0 border-2 rounded-lg"
          style={{
            background: 'linear-gradient(45deg, rgba(255,215,0,0.1), rgba(255,105,180,0.1), rgba(138,43,226,0.1))',
            borderImageSource: 'linear-gradient(45deg, #FFD700, #FF69B4, #8A2BE2)',
            borderImageSlice: 1
          }}
          initial={{ 
            scale: 1, 
            opacity: 0.4,
            borderWidth: 2
          }}
          animate={{ 
            scale: [1, 1.08, 0.85], 
            opacity: [0.4, 0.8, 0],
            borderWidth: [2, 4, 0]
          }}
          transition={{ 
            duration: 0.7,
            ease: "easeInOut"
          }}
        />
        
        {/* Central magic burst */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 3],
            opacity: [0, 0.9, 0]
          }}
          transition={{ 
            duration: 0.6,
            delay: 0.1,
            ease: "easeOut"
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 rounded-full blur-lg"
               style={{ 
                 boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 105, 180, 0.6), 0 0 90px rgba(138, 43, 226, 0.4)' 
               }} />
        </motion.div>

        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 0.8,
            delay: 0.3,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </AnimatePresence>
  );

  // If we have a position, render using portal to avoid table structure issues
  return position && typeof window !== 'undefined' 
    ? createPortal(effectContent, document.body)
    : effectContent;
}