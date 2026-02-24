"use client";

/**
 * Generative SVG avatar for coaches.
 * Creates unique, personality-driven abstract faces using the coach's
 * accent color and personality traits as seeds.
 */

interface CoachAvatarProps {
  name: string;
  accentColor: string;
  avatarUrl?: string | null;
  personality?: {
    humor?: number;
    directness?: number;
    warmth?: number;
    intensity?: number;
    socratic?: number;
    formality?: number;
  };
  size?: number;
  className?: string;
}

// Simple hash to generate deterministic values from a string
function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

// Get a deterministic value 0-1 from name + index
function seeded(name: string, index: number): number {
  return (hashStr(name + index.toString()) % 1000) / 1000;
}

// Lighten/adjust a hex color
function adjustColor(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

// Mix two hex colors
function mixColors(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

export function CoachAvatar({ name, accentColor, avatarUrl, personality, size = 48, className = "" }: CoachAvatarProps) {
  // If we have a real photo, show it
  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={name}
          width={size}
          height={size}
          className="rounded-xl object-cover w-full h-full"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: generative SVG avatar
  const p = personality || {};
  const warmth = (p.warmth ?? 50) / 100;
  const intensity = (p.intensity ?? 50) / 100;
  const humor = (p.humor ?? 50) / 100;
  const formality = (p.formality ?? 50) / 100;

  const s = (i: number) => seeded(name, i);

  // Background gradient angle based on personality
  const gradAngle = Math.round(s(0) * 360);
  const bgLight = adjustColor(accentColor, 80);
  const bgMid = adjustColor(accentColor, 40);

  // Eye style driven by personality
  const eyeY = 38 + s(1) * 4;
  const eyeSpacing = 8 + formality * 4;
  const eyeSize = 2.5 + warmth * 2;
  const eyeShape = humor > 0.6 ? "round" : formality > 0.6 ? "square" : "oval";

  // Mouth driven by humor + warmth
  const mouthY = 56 + s(2) * 6;
  const smileWidth = 6 + humor * 10;
  const smileCurve = warmth > 0.5 ? 3 + humor * 4 : -(1 + (1 - warmth) * 2);

  // Head shape
  const headRound = 30 + warmth * 15;

  // Decorative shapes based on intensity & domain
  const decoCount = Math.round(1 + intensity * 3);

  // Cheek blush for warm personalities
  const showBlush = warmth > 0.6;

  // Initials as fallback/overlay
  const initials = name
    .replace(/^(Dr\.|Prof\.|Colonel|Coach|Nana|"[^"]*"\s*)/i, "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="rounded-xl overflow-hidden"
      >
        <defs>
          <linearGradient id={`bg-${name.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bgLight} />
            <stop offset="50%" stopColor={bgMid} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
          <radialGradient id={`glow-${name.replace(/\s/g, '')}`}>
            <stop offset="0%" stopColor={adjustColor(accentColor, 100)} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="100" height="100" fill={`url(#bg-${name.replace(/\s/g, '')})`} rx="12" />

        {/* Soft glow */}
        <circle cx={50 + s(3) * 20 - 10} cy={30 + s(4) * 20} r="35" fill={`url(#glow-${name.replace(/\s/g, '')})`} />

        {/* Decorative floating shapes */}
        {Array.from({ length: decoCount }).map((_, i) => {
          const dx = 10 + s(10 + i) * 80;
          const dy = 5 + s(20 + i) * 30;
          const dr = 3 + s(30 + i) * 6;
          const opacity = 0.15 + s(40 + i) * 0.2;
          return s(50 + i) > 0.5 ? (
            <circle key={i} cx={dx} cy={dy} r={dr} fill="white" opacity={opacity} />
          ) : (
            <rect key={i} x={dx - dr} y={dy - dr} width={dr * 2} height={dr * 2} rx={dr * 0.3} fill="white" opacity={opacity} transform={`rotate(${s(60 + i) * 45}, ${dx}, ${dy})`} />
          );
        })}

        {/* Head / face circle */}
        <circle cx="50" cy="48" r={headRound} fill="white" opacity="0.9" />

        {/* Eyes */}
        {eyeShape === "round" ? (
          <>
            <circle cx={50 - eyeSpacing} cy={eyeY} r={eyeSize} fill="#2d2a26" />
            <circle cx={50 + eyeSpacing} cy={eyeY} r={eyeSize} fill="#2d2a26" />
            {/* Eye sparkles for humorous chars */}
            {humor > 0.5 && (
              <>
                <circle cx={50 - eyeSpacing + 0.8} cy={eyeY - 0.8} r={0.8} fill="white" />
                <circle cx={50 + eyeSpacing + 0.8} cy={eyeY - 0.8} r={0.8} fill="white" />
              </>
            )}
          </>
        ) : eyeShape === "square" ? (
          <>
            <rect x={50 - eyeSpacing - eyeSize} y={eyeY - eyeSize * 0.7} width={eyeSize * 2} height={eyeSize * 1.4} rx={eyeSize * 0.3} fill="#2d2a26" />
            <rect x={50 + eyeSpacing - eyeSize} y={eyeY - eyeSize * 0.7} width={eyeSize * 2} height={eyeSize * 1.4} rx={eyeSize * 0.3} fill="#2d2a26" />
          </>
        ) : (
          <>
            <ellipse cx={50 - eyeSpacing} cy={eyeY} rx={eyeSize * 1.2} ry={eyeSize * 0.8} fill="#2d2a26" />
            <ellipse cx={50 + eyeSpacing} cy={eyeY} rx={eyeSize * 1.2} ry={eyeSize * 0.8} fill="#2d2a26" />
          </>
        )}

        {/* Eyebrows — more pronounced for intense personalities */}
        {intensity > 0.4 && (
          <>
            <line
              x1={50 - eyeSpacing - eyeSize * 1.2}
              y1={eyeY - eyeSize * 1.8 - intensity * 2}
              x2={50 - eyeSpacing + eyeSize * 1.2}
              y2={eyeY - eyeSize * 1.5 - intensity * 2}
              stroke="#2d2a26"
              strokeWidth={1 + intensity}
              strokeLinecap="round"
              opacity={0.3 + intensity * 0.4}
            />
            <line
              x1={50 + eyeSpacing - eyeSize * 1.2}
              y1={eyeY - eyeSize * 1.5 - intensity * 2}
              x2={50 + eyeSpacing + eyeSize * 1.2}
              y2={eyeY - eyeSize * 1.8 - intensity * 2}
              stroke="#2d2a26"
              strokeWidth={1 + intensity}
              strokeLinecap="round"
              opacity={0.3 + intensity * 0.4}
            />
          </>
        )}

        {/* Cheek blush */}
        {showBlush && (
          <>
            <circle cx={50 - eyeSpacing - 4} cy={eyeY + 7} r="4" fill={accentColor} opacity="0.15" />
            <circle cx={50 + eyeSpacing + 4} cy={eyeY + 7} r="4" fill={accentColor} opacity="0.15" />
          </>
        )}

        {/* Mouth */}
        <path
          d={`M ${50 - smileWidth / 2} ${mouthY} Q 50 ${mouthY + smileCurve} ${50 + smileWidth / 2} ${mouthY}`}
          fill="none"
          stroke="#2d2a26"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Glasses for formal/socratic personalities */}
        {formality > 0.65 && (
          <>
            <circle cx={50 - eyeSpacing} cy={eyeY} r={eyeSize + 3} fill="none" stroke="#2d2a26" strokeWidth="0.8" opacity="0.25" />
            <circle cx={50 + eyeSpacing} cy={eyeY} r={eyeSize + 3} fill="none" stroke="#2d2a26" strokeWidth="0.8" opacity="0.25" />
            <line x1={50 - eyeSpacing + eyeSize + 3} y1={eyeY} x2={50 + eyeSpacing - eyeSize - 3} y2={eyeY} stroke="#2d2a26" strokeWidth="0.8" opacity="0.25" />
          </>
        )}

        {/* Hair/hat accent for some personalities */}
        {s(70) > 0.4 && (
          <path
            d={`M ${50 - headRound + 5} ${48 - headRound + 3} Q 50 ${48 - headRound - 6 - s(71) * 8} ${50 + headRound - 5} ${48 - headRound + 3}`}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  );
}

/** Smaller badge-style avatar for inline use */
export function CoachAvatarSmall({ name, accentColor, avatarUrl, size = 32, className = "" }: { name: string; accentColor: string; avatarUrl?: string | null; size?: number; className?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-lg object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  const initials = name
    .replace(/^(Dr\.|Prof\.|Colonel|Coach|Nana|"[^"]*"\s*)/i, "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-lg text-white font-bold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: accentColor,
        fontSize: size * 0.35,
        boxShadow: `0 2px 8px ${accentColor}30`,
      }}
    >
      {initials}
    </div>
  );
}
