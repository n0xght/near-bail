import React from 'react'

interface AuditWardenProps {
  className?: string
}

/**
 * Stage 6 asset: a half-body auditor behind a ledger desk, inspecting a page
 * with a magnifying glass while holding a stamp. Drawn as its own scene, not a
 * crop of the generic WardenSvg figure.
 */
export const AuditWarden: React.FC<AuditWardenProps> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 340 230"
    className={`select-none overflow-visible ${className || 'w-full h-auto'}`}
    aria-label="half-body warden auditing ledgers with a magnifying glass and stamp"
  >
    <defs>
      <filter id="audit-sketch" x="-10%" y="-10%" width="120%" height="120%">
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

    <g filter="url(#audit-sketch)">
      {/* Torso behind the audit desk */}
      <path
        d="M 157 115 C 128 119, 110 132, 103 154 C 98 168, 98 182, 100 194"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 160 115 C 188 118, 207 132, 214 154 C 219 168, 219 182, 217 194"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 157 91 C 155 102, 155 112, 157 121"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left arm guiding the magnifier */}
      <path
        d="M 128 126 C 112 138, 110 154, 120 168"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 120 168 C 128 164, 134 170, 130 176 C 124 182, 116 176, 114 172"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Right arm reaching for the stamp */}
      <path
        d="M 188 126 C 208 138, 220 148, 230 158"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 230 158 C 238 154, 244 160, 240 166 C 234 172, 226 166, 224 162"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Head */}
      <path
        d="M 158 28 C 179 27, 190 43, 188 62 C 186 81, 170 92, 152 90 C 134 89, 125 75, 127 56 C 129 40, 140 29, 158 28 Z"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 134 51 Q 145 48, 154 52 Q 152 62, 139 61 Q 133 58, 134 51 M 162 52 Q 174 48, 184 52 Q 183 62, 169 61 Q 162 59, 162 52 M 154 52 Q 157 50, 162 52"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#111"
      />
      <path
        d="M 133 44 Q 143 41, 152 46 M 161 38 Q 172 31, 182 40"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 144 74 Q 154 79, 166 70"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Audit monocle and chain */}
      <path
        d="M 172 46 A 10 10 0 1 0 172 66 A 10 10 0 1 0 172 46 Z"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 182 60 Q 190 70, 188 82"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Desk surface cutting the body in half */}
      <path
        d="M 20 196 Q 170 188, 320 198"
        stroke="#111"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 44 210 L 56 198 M 78 212 L 90 200 M 258 212 L 270 200 M 292 210 L 304 198"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Audit ledger */}
      <path
        d="M 62 168 Q 90 160, 118 168 Q 122 182, 118 196 Q 90 188, 58 196 Q 56 182, 62 168 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 90 166 Q 92 182, 90 194"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 68 176 Q 80 172, 86 176 M 68 184 Q 80 180, 86 184 M 96 176 Q 108 172, 114 176 M 96 184 Q 108 180, 114 184"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Magnifying glass */}
      <path
        d="M 100 132 A 16 16 0 1 0 100 164 A 16 16 0 1 0 100 132 Z"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 111 159 L 126 174"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 94 140 Q 98 136, 104 137"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stamp and second ledger stack */}
      <path
        d="M 230 158 L 234 146"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 226 146 Q 234 139, 243 146"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 220 162 Q 238 156, 252 162 Q 254 172, 248 178 Q 230 182, 218 176 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 254 184 Q 278 178, 304 184 Q 306 190, 302 194 Q 278 200, 254 194 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />
      <path
        d="M 250 192 Q 276 186, 302 192 Q 304 198, 300 202 Q 276 208, 248 202 Z"
        stroke="#111"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#faf8f2"
      />

      {/* Audit verdict marks */}
      <path
        d="M 230 128 L 238 136 L 252 120"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 268 118 L 282 132 M 282 118 L 268 132"
        stroke="#111"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
)