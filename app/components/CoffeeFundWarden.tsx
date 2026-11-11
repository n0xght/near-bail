import React from 'react'

interface CoffeeFundWardenProps {
  className?: string
}

/**
 * Stage 3 asset: the Warden leaning over a coffee counter with an empty mug
 * and an outstretched palm. Drawn as a half-body bust, independent of the
 * generic WardenSvg rig.
 */
export const CoffeeFundWarden: React.FC<CoffeeFundWardenProps> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 340 240"
    className={`select-none overflow-visible ${className || 'w-full h-auto'}`}
    aria-label="half-body warden holding a coffee mug and asking for coins"
  >
    <defs>
      <filter
        id="coffee-sketch"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.03"
          numOctaves="3"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="1.8"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>

    <g filter="url(#coffee-sketch)">
      {/* Behind-the-counter torso, cut at the waist */}
      <path
        d="M 149 114 C 122 118, 102 130, 94 152 C 90 168, 90 186, 92 202"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 152 114 C 179 118, 198 132, 206 154 C 210 170, 210 186, 208 202"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 150 92 C 148 102, 148 112, 150 120"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left arm, palm out for the coffee fund */}
      <path
        d="M 132 124 C 108 132, 88 140, 72 136"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 72 136 C 61 132, 55 141, 61 148 C 67 155, 77 150, 79 143"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Right arm steadying the mug */}
      <path
        d="M 172 124 C 194 130, 212 140, 224 148"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 224 148 C 232 146, 236 152, 232 158 C 228 164, 220 158, 218 153"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Mug and steam */}
      <path
        d="M 222 130 Q 238 128, 248 132 C 250 146, 247 158, 242 164 Q 232 167, 224 162 C 221 152, 220 140, 222 130 Z"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 248 138 C 259 138, 259 155, 246 157"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 229 118 Q 234 108, 229 100 M 239 118 Q 244 108, 239 100"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 232 144 Q 238 140, 242 146 Q 236 150, 232 144 Z"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#111"
      />

      {/* Head */}
      <path
        d="M 150 30 C 172 29, 184 44, 182 62 C 180 82, 164 94, 147 93 C 128 92, 118 78, 120 59 C 122 42, 133 31, 150 30 Z"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 126 52 Q 137 49, 147 53 Q 145 63, 131 62 Q 125 59, 126 52 M 154 53 Q 166 49, 177 53 Q 176 63, 162 62 Q 155 59, 154 53 M 147 53 Q 150 51, 154 53"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#111"
      />
      <path
        d="M 127 45 Q 137 42, 145 47 M 158 40 Q 168 33, 178 41"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 138 76 Q 150 84, 163 70"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Counter and half-body cut */}
      <path
        d="M 20 214 Q 170 206, 320 216"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 52 228 L 64 216 M 86 230 L 98 218 M 252 228 L 264 216 M 288 226 L 300 214"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tip jar */}
      <path
        d="M 44 166 Q 60 162, 76 168 C 78 186, 76 200, 72 210 Q 58 214, 46 208 C 42 194, 42 178, 44 166 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 52 168 H 68"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 54 190 Q 60 186, 66 190 Q 66 196, 60 196 Q 54 196, 54 190 Z M 62 200 Q 68 196, 74 200 Q 74 206, 68 206 Q 62 206, 62 200 Z"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
    </g>
  </svg>
)