"use client";

import React from "react";

interface KrathongArtProps {
  baseId: string;
  flowerId: string;
  candleId: string;
  decorId: string;
  auraId?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const SIZE_MAP = {
  sm: 88,
  md: 128,
  lg: 176,
};

export function KrathongArt({
  baseId,
  flowerId,
  candleId,
  decorId,
  auraId = "none",
  size = "md",
  animate = true,
}: KrathongArtProps) {
  const px = SIZE_MAP[size];

  const baseColors: Record<string, { main: string; rim: string; dark: string }> = {
    "banana-leaf": { main: "#22c55e", rim: "#4ade80", dark: "#15803d" },
    "coconut-shell": { main: "#92400e", rim: "#b45309", dark: "#451a03" },
    "bread-lotus": { main: "#eab308", rim: "#fde047", dark: "#a16207" },
    "pastel-petal": { main: "#f472b6", rim: "#fbcfe8", dark: "#be185d" },
    "banana-boat": { main: "#16a34a", rim: "#86efac", dark: "#14532d" },
    "golden-swan": { main: "#f59e0b", rim: "#fef08a", dark: "#b45309" },
    "ice-lotus": { main: "#38bdf8", rim: "#bae6fd", dark: "#0369a1" },
    "blooming-lotus": { main: "#f472b6", rim: "#fce7f3", dark: "#9d174d" },
    "heart-krathong": { main: "#fb7185", rim: "#fecdd3", dark: "#be123c" },
    "star-eight": { main: "#10b981", rim: "#fde047", dark: "#065f46" },
    "royal-barge": { main: "#d97706", rim: "#fde047", dark: "#78350f" },
    "bamboo-raft": { main: "#a16207", rim: "#eab308", dark: "#713f12" },
  };
  const base = baseColors[baseId] || baseColors["banana-leaf"];

  const flowerColors: Record<string, { petal: string; inner: string }> = {
    marigold: { petal: "#f59e0b", inner: "#fef08a" },
    "pink-lotus": { petal: "#ec4899", inner: "#fbcfe8" },
    "purple-orchid": { petal: "#a855f7", inner: "#e9d5ff" },
    "jasmine-garland": { petal: "#f8fafc", inner: "#cbd5e1" },
    "red-rose": { petal: "#e11d48", inner: "#fda4af" },
    sunflower: { petal: "#facc15", inner: "#78350f" },
    hibiscus: { petal: "#fb923c", inner: "#fef08a" },
    "sakura-pink": { petal: "#f9a8d4", inner: "#fdf2f8" },
    "blue-butterfly-pea": { petal: "#4f46e5", inner: "#a5b4fc" },
    "white-champaka": { petal: "#fefce8", inner: "#facc15" },
  };
  const flower = flowerColors[flowerId] || flowerColors["pink-lotus"];

  const candleConfig: Record<
    string,
    {
      body: string;
      glow: string;
      flameOuter: string;
      flameInner: string;
      mode?: "lamp" | "twin" | "lotusBud" | "yiPeng" | "crystal";
    }
  > = {
    "classic-yellow": {
      body: "#facc15",
      glow: "#fde047",
      flameOuter: "#fb923c",
      flameInner: "#fef08a",
    },
    "pastel-aroma": {
      body: "#fda4af",
      glow: "#fecdd3",
      flameOuter: "#fb923c",
      flameInner: "#fef08a",
    },
    "digital-lantern": {
      body: "#38bdf8",
      glow: "#7dd3fc",
      flameOuter: "#38bdf8",
      flameInner: "#e0f2fe",
      mode: "lamp",
    },
    "golden-lamp": {
      body: "#fbbf24",
      glow: "#fef08a",
      flameOuter: "#fbbf24",
      flameInner: "#fffbeb",
      mode: "lamp",
    },
    "twin-lotus-candle": {
      body: "#f472b6",
      glow: "#f9a8d4",
      flameOuter: "#fb923c",
      flameInner: "#fef08a",
      mode: "twin",
    },
    "sky-flame": {
      body: "#a5f3fc",
      glow: "#67e8f9",
      flameOuter: "#06b6d4",
      flameInner: "#ecfeff",
    },
    "lotus-bud-candle": {
      body: "#ec4899",
      glow: "#f9a8d4",
      flameOuter: "#fb923c",
      flameInner: "#fef08a",
      mode: "lotusBud",
    },
    "floating-yi-peng": {
      body: "#fb923c",
      glow: "#fdba74",
      flameOuter: "#f59e0b",
      flameInner: "#fffbeb",
      mode: "yiPeng",
    },
    "rainbow-crystal": {
      body: "#c084fc",
      glow: "#e879f9",
      flameOuter: "#38bdf8",
      flameInner: "#fdf4ff",
      mode: "crystal",
    },
  };
  const candle = candleConfig[candleId] || candleConfig["classic-yellow"];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animate ? "animate-float-bob" : ""
      }`}
      style={{ width: px, height: px }}
    >
      {/* Aura Background Layer */}
      {auraId === "rainbow-mist" && (
        <div
          className="pointer-events-none absolute inset-1 rounded-full blur-xl opacity-55 animate-pulse"
          style={{
            background:
              "conic-gradient(from 0deg, #f472b6, #fbbf24, #34d399, #38bdf8, #a855f7, #f472b6)",
          }}
        />
      )}
      {auraId === "gold-ring" && (
        <div className="pointer-events-none absolute inset-2 rounded-full border-2 border-amber-300/60 shadow-[0_0_24px_rgba(251,191,36,0.55)] animate-pulse" />
      )}
      {auraId === "moonlight-halo" && (
        <div className="pointer-events-none absolute inset-1.5 rounded-full border-2 border-sky-200/65 shadow-[0_0_26px_rgba(186,230,253,0.6)] animate-pulse" />
      )}

      {/* Candle radial glow */}
      <div
        className="pointer-events-none absolute top-2 h-1/2 w-1/2 rounded-full blur-xl opacity-45"
        style={{ backgroundColor: candle.glow }}
      />

      <svg
        viewBox="0 0 160 160"
        width={px}
        height={px}
        className="overflow-visible drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
      >
        {/* Aura SVG Particles */}
        {auraId === "fireflies" && (
          <g>
            <circle cx="24" cy="56" r="3" fill="#bef264" className="animate-twinkle" />
            <circle cx="136" cy="48" r="2.8" fill="#fde047" className="animate-twinkle" />
            <circle cx="34" cy="30" r="2.2" fill="#86efac" className="animate-twinkle" />
            <circle cx="122" cy="86" r="2.6" fill="#bef264" className="animate-twinkle" />
          </g>
        )}
        {auraId === "star-sparkle" && (
          <g fill="#fef08a">
            <path d="M28 42 L31 48 L37 51 L31 54 L28 60 L25 54 L19 51 L25 48 Z" className="animate-twinkle" />
            <path d="M132 36 L134 41 L139 43 L134 45 L132 50 L130 45 L125 43 L130 41 Z" className="animate-twinkle" />
            <path d="M128 84 L130 88 L134 90 L130 92 L128 96 L126 92 L122 90 L126 88 Z" className="animate-twinkle" />
          </g>
        )}
        {auraId === "falling-petals" && (
          <g fill="#f9a8d4">
            <ellipse cx="30" cy="44" rx="4" ry="2.2" className="animate-petal-fall" />
            <ellipse cx="130" cy="52" rx="4" ry="2.2" className="animate-petal-fall" />
            <ellipse cx="46" cy="26" rx="3.2" ry="1.8" className="animate-petal-fall" />
          </g>
        )}
        {auraId === "lantern-sparks" && (
          <g fill="#fb923c">
            <circle cx="32" cy="64" r="2.5" className="animate-twinkle" />
            <circle cx="128" cy="56" r="2.5" fill="#fde047" className="animate-twinkle" />
            <circle cx="52" cy="34" r="2" fill="#fdba74" className="animate-twinkle" />
            <circle cx="108" cy="30" r="2.2" fill="#fde047" className="animate-twinkle" />
          </g>
        )}

        {/* Water ripple rings */}
        <ellipse
          cx="80"
          cy="132"
          rx="58"
          ry="11"
          fill="none"
          stroke={
            auraId === "gold-ring"
              ? "rgba(251,191,36,0.55)"
              : auraId === "moonlight-halo"
              ? "rgba(186,230,253,0.6)"
              : "rgba(125,211,252,0.35)"
          }
          strokeWidth="1.5"
        />
        <ellipse cx="80" cy="133" rx="45" ry="7.5" fill="rgba(56,189,248,0.12)" />

        {/* Incense sticks */}
        <line x1="72" y1="88" x2="62" y2="42" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="80" y1="88" x2="80" y2="38" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="88" y1="88" x2="98" y2="42" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="62" cy="41" r="2.2" fill="#fb7185" />
        <circle cx="80" cy="37" r="2.2" fill="#fb7185" />
        <circle cx="98" cy="41" r="2.2" fill="#fb7185" />

        {/* Candle / Lamp Variants */}
        {candle.mode === "lamp" ? (
          <g>
            <rect
              x="71"
              y="56"
              width="18"
              height="28"
              rx="4"
              fill={candle.body}
              stroke="#fffbeb"
              strokeWidth="1.5"
            />
            <path d="M68 56 L80 45 L92 56 Z" fill="#f59e0b" />
            <circle cx="80" cy="70" r="5" fill="#fffbeb" className="animate-pulse" />
          </g>
        ) : candle.mode === "twin" ? (
          <g>
            <rect x="68" y="61" width="8" height="27" rx="3" fill={candle.body} />
            <rect x="84" y="61" width="8" height="27" rx="3" fill={candle.body} />
            <g className="animate-candle-flicker">
              <path d="M72 44 C76 50, 76 57, 72 60 C68 57, 68 50, 72 44 Z" fill={candle.flameOuter} />
              <path d="M88 44 C92 50, 92 57, 88 60 C84 57, 84 50, 88 44 Z" fill={candle.flameOuter} />
            </g>
          </g>
        ) : candle.mode === "lotusBud" ? (
          <g>
            <path d="M80 56 C70 66, 70 84, 80 88 C90 84, 90 66, 80 56 Z" fill="#f472b6" stroke="#fbcfe8" strokeWidth="1.2" />
            <path d="M72 72 Q80 88 88 72" fill="#db2777" opacity="0.65" />
            <g className="animate-candle-flicker">
              <path d="M80 40 C84 46, 84 53, 80 56 C76 53, 76 46, 80 40 Z" fill={candle.flameOuter} />
              <path d="M80 45 C82 48, 82 52, 80 54 C78 52, 78 48, 80 45 Z" fill={candle.flameInner} />
            </g>
          </g>
        ) : candle.mode === "yiPeng" ? (
          <g>
            <line x1="80" y1="68" x2="80" y2="89" stroke="#ca8a04" strokeWidth="2" />
            <path d="M68 38 Q80 28 92 38 L89 65 Q80 69 71 65 Z" fill="url(#yiPengGrad)" stroke="#fef08a" strokeWidth="1.3" />
            <defs>
              <linearGradient id="yiPengGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="63" r="4" fill="#fffbeb" className="animate-pulse" />
          </g>
        ) : candle.mode === "crystal" ? (
          <g>
            <polygon points="80,45 88,65 84,88 76,88 72,65" fill="#c084fc" stroke="#f5d0fe" strokeWidth="1.4" />
            <polygon points="80,45 84,65 80,88 76,65" fill="#e879f9" opacity="0.7" />
            <circle cx="80" cy="56" r="4" fill="#ecfeff" className="animate-pulse" />
          </g>
        ) : (
          <g>
            <rect
              x="75"
              y="58"
              width="10"
              height="30"
              rx="3"
              fill={candle.body}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
            <g className="animate-candle-flicker">
              <path
                d="M80 39 C85 46, 86 54, 80 57 C74 54, 75 46, 80 39 Z"
                fill={candle.flameOuter}
              />
              <path
                d="M80 44 C82.5 48, 83 53, 80 55 C77 53, 77.5 48, 80 44 Z"
                fill={candle.flameInner}
              />
            </g>
          </g>
        )}

        {/* Base Silhouettes (12 distinct styles!) */}
        {baseId === "banana-boat" ? (
          <g>
            <path
              d="M 14 102 Q 80 120 146 102 Q 134 126 80 130 Q 26 126 14 102 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.8"
            />
            <path d="M 14 102 Q 20 82 32 98" fill={base.rim} stroke={base.dark} strokeWidth="1.2" />
            <path d="M 146 102 Q 140 82 128 98" fill={base.rim} stroke={base.dark} strokeWidth="1.2" />
          </g>
        ) : baseId === "golden-swan" ? (
          <g>
            <path
              d="M 32 104 Q 20 82 32 68 Q 38 64 42 70 Q 34 74 38 96 Z"
              fill={base.rim}
              stroke={base.dark}
              strokeWidth="1.4"
            />
            <path d="M 126 104 Q 146 84 140 108 Z" fill={base.rim} stroke={base.dark} strokeWidth="1.2" />
            <path
              d="M 26 103 Q 80 128 134 103 L 122 124 Q 80 137 38 124 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.6"
            />
          </g>
        ) : baseId === "royal-barge" ? (
          <g>
            {/* Suphannahong ornate prow & tail */}
            <path
              d="M 28 106 Q 10 72 22 52 Q 27 46 31 54 Q 22 66 36 100 Z"
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth="1.4"
            />
            <circle cx="24" cy="54" r="2.2" fill="#dc2626" />
            <path d="M 20 68 L 16 78" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M 132 104 Q 148 76 144 62 Q 138 78 124 102 Z"
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth="1.3"
            />
            <path
              d="M 24 104 Q 80 124 136 104 L 126 123 Q 80 134 34 123 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.6"
            />
          </g>
        ) : baseId === "heart-krathong" ? (
          <g>
            <path
              d="M 24 98 C 22 82, 54 78, 80 96 C 106 78, 138 82, 136 98 C 134 116, 80 135, 80 135 C 80 135, 26 116, 24 98 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.7"
            />
            <path
              d="M 32 100 C 32 88, 58 86, 80 100 C 102 86, 128 88, 128 100"
              fill="none"
              stroke={base.rim}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ) : baseId === "blooming-lotus" ? (
          <g>
            {/* Outer wide blooming petals */}
            {[24, 44, 66, 94, 116, 136].map((cx, i) => (
              <ellipse
                key={`bl-${i}`}
                cx={cx}
                cy={102}
                rx="16"
                ry="12"
                transform={`rotate(${(i - 2.5) * 14} ${cx} 102)`}
                fill={base.rim}
                stroke={base.dark}
                strokeWidth="1.2"
              />
            ))}
            <path
              d="M 28 106 Q 80 128 132 106 L 120 124 Q 80 137 40 124 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.5"
            />
          </g>
        ) : baseId === "star-eight" ? (
          <g>
            {[22, 42, 62, 80, 98, 118, 138].map((cx, i) => (
              <polygon
                key={`st-${i}`}
                points={`${cx - 12},105 ${cx},76 ${cx + 12},105`}
                fill={i % 2 === 0 ? base.main : base.rim}
                stroke={base.dark}
                strokeWidth="1.2"
              />
            ))}
            <path
              d="M 24 104 Q 80 128 136 104 L 122 125 Q 80 136 38 125 Z"
              fill={base.dark}
              stroke={base.rim}
              strokeWidth="1.4"
            />
          </g>
        ) : baseId === "bamboo-raft" ? (
          <g>
            {[0, 1, 2, 3].map((row) => (
              <rect
                key={`bm-${row}`}
                x={22 + row * 2}
                y={100 + row * 6.5}
                width={116 - row * 4}
                height="6.5"
                rx="3"
                fill={row % 2 === 0 ? base.main : base.rim}
                stroke={base.dark}
                strokeWidth="1.1"
              />
            ))}
            <line x1="46" y1="99" x2="46" y2="126" stroke="#451a03" strokeWidth="2.2" />
            <line x1="114" y1="99" x2="114" y2="126" stroke="#451a03" strokeWidth="2.2" />
          </g>
        ) : (
          <g>
            {[28, 48, 68, 92, 112, 132].map((cx, i) => (
              <path
                key={`bp-${i}`}
                d={`M ${cx - 12} 102 Q ${cx} 74 ${cx + 12} 102 Z`}
                fill={base.rim}
                stroke={base.dark}
                strokeWidth="1.2"
              />
            ))}
            <path
              d="M 24 102 Q 80 128 136 102 L 122 124 Q 80 138 38 124 Z"
              fill={base.main}
              stroke={base.dark}
              strokeWidth="1.6"
              opacity={baseId === "ice-lotus" ? 0.85 : 1}
            />
            <ellipse
              cx="80"
              cy="102"
              rx="55"
              ry="13"
              fill={base.dark}
              opacity="0.85"
            />
            {[38, 56, 72, 88, 104, 122].map((cx, i) => (
              <path
                key={`fp-${i}`}
                d={`M ${cx - 10} 107 Q ${cx} 84 ${cx + 10} 107 Z`}
                fill={base.main}
                stroke={base.rim}
                strokeWidth="1"
              />
            ))}
          </g>
        )}

        {/* Flowers ring */}
        {[40, 56, 80, 104, 120].map((cx, i) => {
          const cy = i === 2 ? 105 : i === 1 || i === 3 ? 102 : 98;
          return (
            <g key={`fl-${i}`} transform={`translate(${cx}, ${cy})`}>
              <circle cx="-4" cy="-2" r="5" fill={flower.petal} />
              <circle cx="4" cy="-2" r="5" fill={flower.petal} />
              <circle cx="0" cy="-6" r="5" fill={flower.petal} />
              <circle cx="-3" cy="3" r="4.5" fill={flower.petal} />
              <circle cx="3" cy="3" r="4.5" fill={flower.petal} />
              <circle cx="0" cy="0" r="3.5" fill={flower.inner} />
            </g>
          );
        })}

        {/* Decoration layer (15 varieties!) */}
        {decorId === "garland" && (
          <path
            d="M 46 112 Q 80 128 114 112"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="4.5"
            strokeDasharray="3 4"
            strokeLinecap="round"
          />
        )}
        {decorId === "lucky-coin" && (
          <g>
            <circle cx="52" cy="116" r="7" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
            <text x="52" y="119" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350f">
              ฿
            </text>
            <circle cx="108" cy="116" r="7" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
            <text x="108" y="119" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350f">
              ฿
            </text>
          </g>
        )}
        {decorId === "eco-butterfly" && (
          <g transform="translate(114, 72) rotate(12)">
            <ellipse cx="-5" cy="-3" rx="6" ry="4" fill="#34d399" />
            <ellipse cx="5" cy="-3" rx="6" ry="4" fill="#6ee7b7" />
            <ellipse cx="-4" cy="3" rx="4" ry="3" fill="#10b981" />
            <ellipse cx="4" cy="3" rx="4" ry="3" fill="#10b981" />
            <rect x="-1" y="-5" width="2" height="10" rx="1" fill="#064e3b" />
          </g>
        )}
        {decorId === "origami-crane" && (
          <g transform="translate(116, 76)">
            <path d="M -8 4 L 2 -6 L 12 2 L 2 6 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <path d="M -2 0 L -10 -7 L 3 -2 Z" fill="#fde047" />
          </g>
        )}
        {decorId === "mini-lanterns" && (
          <g>
            <rect x="36" y="72" width="10" height="14" rx="4" fill="#fb7185" stroke="#fef08a" strokeWidth="1.2" />
            <rect x="114" y="72" width="10" height="14" rx="4" fill="#fb7185" stroke="#fef08a" strokeWidth="1.2" />
          </g>
        )}
        {decorId === "cute-turtle" && (
          <g transform="translate(115, 89)">
            <ellipse cx="0" cy="2" rx="9" ry="6" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" />
            <circle cx="-10" cy="1" r="3.5" fill="#4ade80" />
            <circle cx="-11" cy="0" r="0.8" fill="#0f172a" />
            <path d="M -4 -1 L 0 -3 L 4 -1 L 2 4 L -2 4 Z" fill="#86efac" opacity="0.6" />
          </g>
        )}
        {decorId === "koi-fish" && (
          <g transform="translate(45, 92) rotate(-10)">
            <ellipse cx="0" cy="0" rx="10" ry="4.5" fill="#fb923c" stroke="#fff7ed" strokeWidth="1" />
            <polygon points="8,0 15,-4 15,4" fill="#f97316" />
            <circle cx="-5" cy="-1" r="1" fill="#0f172a" />
            <circle cx="1" cy="-1" r="2.2" fill="#ffffff" opacity="0.8" />
          </g>
        )}
        {decorId === "paper-umbrella" && (
          <g transform="translate(116, 74) rotate(14)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#78350f" strokeWidth="2" />
            <path d="M -15 2 Q 0 -14 15 2 Z" fill="#e11d48" stroke="#fde047" strokeWidth="1.3" />
            <line x1="0" y1="-6" x2="-7" y2="2" stroke="#fef08a" strokeWidth="0.9" />
            <line x1="0" y1="-6" x2="7" y2="2" stroke="#fef08a" strokeWidth="0.9" />
          </g>
        )}
        {decorId === "thai-elephant" && (
          <g transform="translate(46, 84)">
            <rect x="-8" y="-3" width="14" height="10" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            <circle cx="-8" cy="-1" r="4.5" fill="#cbd5e1" />
            <path d="M -11 1 Q -14 7 -10 8" fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="-5" y="-4" width="8" height="5" rx="1" fill="#f59e0b" />
          </g>
        )}
        {decorId === "tag-wish-true" && (
          <g transform="translate(80, 122)">
            <rect x="-26" y="-9" width="52" height="17" rx="8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#075985">
              สมหวัง!
            </text>
          </g>
        )}
        {decorId === "tag-healthy" && (
          <g transform="translate(80, 122)">
            <rect x="-31" y="-9" width="62" height="17" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.2" fontWeight="700" fill="#166534">
              สุขภาพดี
            </text>
          </g>
        )}
        {decorId === "tag-eco" && (
          <g transform="translate(80, 122)">
            <rect x="-28" y="-9" width="56" height="17" rx="8" fill="#d1fae5" stroke="#059669" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.2" fontWeight="700" fill="#065f46">
              รักษ์โลก
            </text>
          </g>
        )}
        {decorId === "tag-work-pang" && (
          <g transform="translate(80, 122)">
            <rect x="-26" y="-9" width="52" height="17" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#92400e">
              งานปัง!
            </text>
          </g>
        )}
        {decorId === "tag-bonus" && (
          <g transform="translate(80, 122)">
            <rect x="-29" y="-9" width="58" height="17" rx="8" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#9d174d">
              โบนัสพุ่ง!
            </text>
          </g>
        )}
        {decorId === "tag-rich" && (
          <g transform="translate(80, 122)">
            <rect x="-30" y="-9" width="60" height="17" rx="8" fill="#fef08a" stroke="#b45309" strokeWidth="1.4" />
            <text x="0" y="3" textAnchor="middle" fontSize="9.2" fontWeight="700" fill="#78350f">
              รวยๆ เฮงๆ
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
