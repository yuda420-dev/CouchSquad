"use client";

import { motion } from "framer-motion";
import type { PersonalityTraits } from "@/lib/supabase/types";

/** Animated floating gradient blob */
export function GradientBlob({
  color1,
  color2,
  size = 400,
  className = "",
  delay = 0,
}: {
  color1: string;
  color2: string;
  size?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 0.97, 1.02, 1],
          rotate: [0, 3, -2, 1, 0],
        }}
        transition={{
          duration: 12 + delay * 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(ellipse at 40% 40%, ${color1}30, ${color2}15, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

/** Floating decorative circles with parallax feel */
export function FloatingCircles({ className = "" }: { className?: string }) {
  const circles = [
    { x: "10%", y: "20%", size: 8, color: "#e8633b", delay: 0 },
    { x: "85%", y: "15%", size: 6, color: "#f4a261", delay: 0.5 },
    { x: "70%", y: "60%", size: 10, color: "#2a9d8f", delay: 1 },
    { x: "20%", y: "70%", size: 5, color: "#e9c46a", delay: 0.3 },
    { x: "50%", y: "10%", size: 7, color: "#e76f51", delay: 0.8 },
    { x: "90%", y: "45%", size: 4, color: "#264653", delay: 1.2 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {circles.map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            opacity: 0.25,
          }}
          animate={{
            y: [0, -10, 5, -5, 0],
            x: [0, 3, -2, 4, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            delay: c.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Wavy section divider SVG */
export function WaveDivider({
  color = "#faf8f5",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? "rotate-180" : ""} ${className}`}>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-12 sm:h-16">
        <path
          d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

/** Personality radar/flower chart — visual representation of coach personality.
 *  Uses the 6 core traits for the radar shape. Additional traits are shown in sliders only. */
export function PersonalityFlower({
  traits,
  color,
  size = 80,
}: {
  traits: PersonalityTraits;
  color: string;
  size?: number;
}) {
  // Always use the core 6 for the radar chart — keeps the shape clean
  const keys = ["humor", "directness", "warmth", "intensity", "socratic", "formality"] as const;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.42;

  const points = keys.map((key, i) => {
    const angle = (i / keys.length) * Math.PI * 2 - Math.PI / 2;
    const val = (traits[key] ?? 50) / 100;
    const r = maxR * (0.3 + val * 0.7);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circles */}
      {[0.3, 0.6, 1].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={maxR * r} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      ))}
      {/* Radar area */}
      <path d={pathD} fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

/** Emoji burst — a cluster of emojis for playful accent */
export function EmojiBurst({
  emojis,
  className = "",
}: {
  emojis: string[];
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {emojis.map((emoji, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
          className="text-lg"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}
