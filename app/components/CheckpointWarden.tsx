import React from 'react'

interface CheckpointWardenProps {
  className?: string
}

/**
 * Stage 5 asset: a checkpoint clerk cut off at the counter. Holds a clipboard,
 * points at a failing terminal, and never shows a lower body. Drawn from
 * scratch rather than cropping the generic WardenSvg figure.
 */
export const CheckpointWarden: React.FC<CheckpointWardenProps> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 340 230"
    className={`select-none overflow-visible ${className || 'w-full h-auto'}`}
    aria-label="half-body checkpoint warden at a counter with a clipboard and terminal"
  >
    <defs>
      <filter
        id="checkpoint-sketch"
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

    <g filter="url(#checkpoint-sketch)">
      {/* Torso behind the counter */}
      <path
        d="M 148 114 C 120 118, 102 132, 96 154 C 92 168, 92 182, 94 198"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 162 114 C 190 118, 208 132, 216 154 C 220 168, 220 182, 218 198"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 158 92 C 156 102, 156 112, 158 120"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left arm holding a clipboard */}
      <path
        d="M 134 124 C 116 134, 104 148, 108 164"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 108 164 C 116 160, 122 166, 118 172 C 114 178, 106 172, 104 168"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Right arm pointing at the terminal */}
      <path
        d="M 176 124 C 198 134, 214 144, 226 152"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 226 152 C 234 148, 240 154, 236 160 C 230 166, 222 160, 220 156"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Head with a flat clerk cap */}
      <path
        d="M 160 26 C 181 25, 191 41, 189 60 C 187 80, 171 91, 153 90 C 134 89, 125 75, 127 56 C 129 39, 141 27, 160 26 Z"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 128 40 C 134 20, 186 18, 192 40"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 119 43 Q 160 35, 201 43"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 136 50 Q 146 47, 156 51 Q 154 61, 141 60 Q 135 57, 136 50 M 163 51 Q 174 47, 185 51 Q 184 61, 170 60 Q 163 58, 163 51 M 156 51 Q 159 49, 163 51"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#111"
      />
      <path
        d="M 136 43 Q 146 41, 155 43 M 164 43 Q 173 41, 182 43"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 149 74 Q 158 72, 168 75"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Badge */}
      <path
        d="M 152 128 Q 166 124, 180 129 Q 182 143, 178 149 Q 164 153, 150 149 Z"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 158 136 H 172 M 158 142 H 168"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Counter cutting the body in half */}
      <path
        d="M 18 188 Q 170 178, 322 190"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 48 202 L 60 190 M 82 204 L 94 192 M 262 204 L 274 192 M 296 202 L 308 190"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clipboard resting over the counter edge */}
      <path
        d="M 82 148 Q 108 142, 128 150 Q 132 172, 126 196 Q 104 190, 80 198 Q 76 172, 82 148 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 98 146 Q 104 140, 112 146"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 90 164 Q 106 160, 118 165 M 88 176 Q 104 172, 116 177 M 88 186 Q 102 182, 114 187"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Failing terminal on the counter */}
      <path
        d="M 232 112 Q 272 106, 288 116 Q 292 140, 288 162 Q 264 168, 232 162 Q 228 136, 232 112 Z"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 258 164 L 258 178 M 244 182 Q 260 176, 278 182"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 242 126 Q 260 122, 278 127 M 242 138 Q 258 135, 270 139 M 246 150 Q 256 148, 264 151"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
)