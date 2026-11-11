import React from 'react'
import { motion } from 'framer-motion'

export type WardenPose =
  | 'idle'
  | 'asleep'
  | 'mocking'
  | 'suspicious'
  | 'panicked'
export type WardenFrame = 'full' | 'closeup' | 'tall'
export type PropVariant =
  | 'none'
  | 'trapdoor'
  | 'keyhole-door'
  | 'anvil'
  | 'vault-door'
  | 'ledger'

const FRAME_VIEWBOX: Record<WardenFrame, string> = {
  full: '0 0 360 280',
  closeup: '68 20 100 100',
  tall: '50 0 160 266',
}

const SLEEP_ZS = [
  { at: 0.01, x: 146, y: 48, scale: 0.8 },
  { at: 0.34, x: 164, y: 28, scale: 1 },
  { at: 0.67, x: 182, y: 6, scale: 1.2 },
]

interface WardenSvgProps {
  pose?: WardenPose
  prop?: PropVariant
  frame?: WardenFrame
  showPlayer?: boolean
  playerTrapped?: boolean
  doorOpen?: boolean
  showGround?: boolean
  sleepProgress?: number
  className?: string
}

const POSE_PATHS: Record<
  WardenPose,
  {
    head: string
    shades: string
    brow: string
    mouth: string
    spine: string
    leftArm: string
    rightArm: string
    leftLeg: string
    rightLeg: string
    extra?: string
  }
> = {
  idle: {
    // Closed organic head loop with cubic curves
    head: 'M 110 38 C 128 36, 136 52, 134 66 C 132 82, 118 90, 106 89 C 92 88, 84 74, 86 58 C 88 44, 96 39, 110 38 Z',
    // Dark warden shades drawn with curved rims
    shades:
      'M 90 56 Q 100 54, 108 57 Q 106 66, 94 65 Q 89 62, 90 56 M 112 57 Q 122 54, 131 56 Q 130 65, 118 65 Q 112 63, 112 57 M 108 57 Q 110 56, 112 57',
    brow: 'M 92 49 Q 101 47, 107 50 M 114 50 Q 121 47, 129 49',
    mouth: 'M 101 76 Q 110 74, 119 77',
    // Slouching spine
    spine: 'M 109 89 C 104 118, 102 146, 107 174',
    // Arms crossed over chest
    leftArm: 'M 106 104 C 84 114, 82 134, 122 132',
    rightArm: 'M 107 104 C 130 112, 132 134, 92 130',
    // Relaxed stance legs
    leftLeg: 'M 107 174 C 96 202, 90 228, 84 252 Q 77 254, 72 251',
    rightLeg: 'M 107 174 C 118 202, 124 228, 130 252 Q 137 254, 142 251',
  },
  asleep: {
    head: 'M 112 40 C 130 39, 136 54, 133 68 C 130 83, 117 90, 105 88 C 91 86, 84 73, 87 58 C 90 45, 99 41, 112 40 Z',
    // Closed eyelids instead of shades
    shades: 'M 90 60 Q 98 65, 106 60 M 113 60 Q 121 65, 129 60',
    brow: 'M 91 52 Q 99 50, 107 52 M 114 52 Q 121 50, 128 52',
    mouth: 'M 104 78 Q 110 82, 116 78 Q 113 84, 110 84 Q 107 84, 104 78 Z',
    // Slumped spine and slack arms
    spine: 'M 111 88 C 101 116, 96 146, 104 174',
    leftArm: 'M 106 104 C 82 116, 78 138, 103 149',
    rightArm: 'M 108 104 C 130 114, 132 138, 108 149',
    leftLeg: 'M 104 174 C 93 202, 87 228, 81 252 Q 74 254, 69 251',
    rightLeg: 'M 104 174 C 115 202, 121 228, 127 252 Q 134 254, 139 251',
  },
  mocking: {
    head: 'M 114 36 C 132 35, 140 50, 137 65 C 134 81, 120 89, 107 87 C 93 85, 86 71, 89 56 C 92 42, 100 37, 114 36 Z',
    shades:
      'M 94 53 Q 104 51, 112 55 Q 110 64, 98 63 Q 93 60, 94 53 M 116 55 Q 126 52, 134 55 Q 133 64, 121 64 Q 116 61, 116 55',
    brow: 'M 95 45 Q 104 41, 111 47 M 118 47 Q 126 41, 133 46',
    // Smirking grin
    mouth: 'M 100 73 Q 114 82, 126 70',
    // Leaning forward laughing/pointing
    spine: 'M 111 87 C 114 116, 112 144, 106 173',
    // Left hand on hip
    leftArm: 'M 112 102 C 88 112, 84 134, 104 146',
    // Right arm pointing directly at the player
    rightArm:
      'M 113 102 C 142 96, 168 92, 194 88 Q 202 87, 204 91 Q 196 95, 188 94',
    leftLeg: 'M 106 173 C 94 201, 88 227, 81 252 Q 74 254, 69 250',
    rightLeg: 'M 106 173 C 120 200, 129 226, 136 251 Q 144 253, 148 249',
  },
  suspicious: {
    head: 'M 108 37 C 126 36, 135 51, 133 66 C 131 82, 117 90, 104 89 C 90 88, 83 74, 85 58 C 87 43, 95 38, 108 37 Z',
    shades:
      'M 89 58 Q 99 56, 107 59 Q 105 67, 93 66 Q 88 64, 89 58 M 111 59 Q 121 56, 130 58 Q 129 66, 117 66 Q 111 64, 111 59',
    // One eyebrow sharply raised
    brow: 'M 90 52 Q 98 51, 105 53 M 112 45 Q 121 37, 131 44',
    mouth: 'M 99 77 C 106 75, 112 79, 118 76',
    spine: 'M 106 89 C 103 118, 104 146, 108 174',
    // Holding the on-chain ledger in left hand
    leftArm: 'M 105 104 C 82 116, 76 138, 92 146',
    // Right hand scratching chin
    rightArm: 'M 106 104 C 128 114, 128 100, 116 86',
    leftLeg: 'M 108 174 C 98 202, 92 228, 87 252 Q 80 254, 75 251',
    rightLeg: 'M 108 174 C 118 202, 123 228, 128 252 Q 135 254, 140 251',
    // Ledger book drawn with curved pages
    extra:
      'M 64 128 Q 80 124, 94 132 C 95 148, 94 160, 92 170 Q 76 164, 62 168 C 62 152, 63 140, 64 128 Z M 72 138 Q 82 136, 88 140 M 71 148 Q 81 146, 87 150',
  },
  panicked: {
    head: 'M 110 34 C 129 33, 138 49, 135 65 C 132 82, 118 91, 104 89 C 90 87, 82 72, 85 56 C 88 41, 96 35, 110 34 Z',
    // Crooked shades slipping off face
    shades:
      'M 86 62 Q 96 58, 105 63 Q 102 72, 90 70 Q 85 67, 86 62 M 110 52 Q 121 47, 131 51 Q 128 60, 116 59 Q 110 57, 110 52 M 105 62 Q 108 57, 110 53',
    brow: 'M 89 44 Q 98 36, 107 43 M 114 41 Q 123 34, 132 42',
    // Open shocked mouth loop
    mouth:
      'M 103 73 C 111 71, 118 75, 117 82 C 115 87, 104 87, 101 81 C 100 77, 101 74, 103 73 Z',
    // Jolted wavy spine
    spine: 'M 107 89 C 114 116, 98 145, 108 173',
    // Both hands clutching head in panic
    leftArm: 'M 107 103 C 74 96, 68 62, 87 46',
    rightArm: 'M 108 103 C 142 94, 148 60, 132 45',
    // Trembling bent knees
    leftLeg: 'M 108 173 C 88 198, 98 226, 82 251 Q 75 253, 70 249',
    rightLeg: 'M 108 173 C 128 198, 118 226, 135 251 Q 142 253, 147 249',
    // Sweat drops around head
    extra:
      'M 72 34 Q 66 42, 71 46 Q 76 42, 72 34 M 148 32 Q 154 40, 149 44 Q 144 40, 148 32',
  },
}

export const WardenSvg: React.FC<WardenSvgProps> = ({
  pose = 'idle',
  prop = 'none',
  frame = 'full',
  showPlayer = false,
  playerTrapped = false,
  doorOpen = false,
  showGround = true,
  sleepProgress = 0,
  className = '',
}) => {
  const current = POSE_PATHS[pose]
  const cropped = frame !== 'full'

  return (
    <svg
      viewBox={FRAME_VIEWBOX[frame]}
      className={`select-none ${
        cropped ? 'overflow-hidden' : 'overflow-visible'
      } ${className || 'w-full max-w-[360px] h-auto'}`}
      aria-label={`warden stickman in ${pose} pose${cropped ? `, ${frame} framing` : ''}`}
    >
      <defs>
        <filter id="sketch" x="-10%" y="-10%" width="120%" height="120%">
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

      <g filter="url(#sketch)">
        {/* Floor sketch curve */}
        {showGround && (
          <path
            d="M 18 254 Q 180 249, 342 255"
            stroke="#111"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Warden Stickman */}
        <g>
          <motion.path
            d={current.head}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#faf8f2"
            animate={{ d: current.head }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.shades}
            stroke="#111"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={pose === 'asleep' ? 'none' : '#111'}
            animate={{ d: current.shades }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.brow}
            stroke="#111"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: current.brow }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.mouth}
            stroke="#111"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: current.mouth }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.spine}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: current.spine }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.leftArm}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ d: current.leftArm }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.rightArm}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ d: current.rightArm }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.leftLeg}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ d: current.leftLeg }}
            transition={{ duration: 0.25 }}
          />
          <motion.path
            d={current.rightLeg}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            animate={{ d: current.rightLeg }}
            transition={{ duration: 0.25 }}
          />
          {current.extra && (
            <motion.path
              d={current.extra}
              stroke="#111"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#faf8f2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, d: current.extra }}
              transition={{ duration: 0.2 }}
            />
          )}
          {SLEEP_ZS.map((z, index) =>
            sleepProgress >= z.at ? (
              <motion.path
                key={index}
                d="M 0 0 H 14 L 0 14 H 14"
                transform={`translate(${z.x} ${z.y}) scale(${z.scale})`}
                stroke="#111"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            ) : null,
          )}
        </g>

        {/* Stage Props drawn purely with Bezier curves */}
        {prop === 'trapdoor' && (
          <g>
            <path
              d={
                playerTrapped
                  ? 'M 218 253 Q 250 254, 286 253 M 220 253 C 232 272, 244 278, 256 279'
                  : 'M 218 253 Q 252 251, 286 253'
              }
              stroke="#111"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {prop === 'keyhole-door' && (
          <g>
            {/* Arched door outline */}
            <path
              d={
                doorOpen
                  ? 'M 228 252 C 226 180, 227 118, 230 78 C 254 64, 282 64, 306 78 C 309 120, 308 182, 306 252'
                  : 'M 228 252 C 226 180, 227 118, 230 78 C 254 64, 282 64, 306 78 C 309 120, 308 182, 306 252 Z'
              }
              stroke="#111"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={doorOpen ? '#111' : '#f3efe6'}
            />
            {/* Keyhole curve */}
            {!doorOpen && (
              <path
                d="M 284 156 C 290 154, 294 160, 290 166 C 292 173, 293 179, 286 180 C 280 179, 281 173, 283 166 C 279 160, 281 155, 284 156 Z"
                stroke="#111"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#111"
              />
            )}
          </g>
        )}

        {prop === 'anvil' && (
          <g>
            <path
              d="M 224 44 Q 266 42, 302 45 C 296 58, 286 64, 282 74 C 290 80, 296 84, 298 92 Q 262 94, 230 92 C 232 84, 238 80, 246 74 C 240 64, 230 58, 224 44 Z"
              stroke="#111"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#222"
            />
          </g>
        )}

        {prop === 'vault-door' && (
          <g>
            {/* Round heavy vault door */}
            <path
              d="M 268 86 C 312 84, 338 122, 336 166 C 334 210, 306 244, 266 246 C 224 244, 198 210, 200 166 C 202 122, 228 88, 268 86 Z"
              stroke="#111"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={doorOpen ? '#1f2937' : '#e5e0d5'}
            />
            {/* Vault wheel spokes drawn with curved arcs */}
            {!doorOpen && (
              <path
                d="M 268 134 C 286 134, 298 148, 298 166 C 298 184, 284 198, 268 198 C 250 198, 238 184, 238 166 C 238 148, 250 134, 268 134 Z M 246 144 Q 268 166, 290 188 M 290 144 Q 268 166, 246 188"
                stroke="#111"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        )}

        {/* Optional Player Stickman on the right side */}
        {showPlayer && (
          <g>
            <path
              d={
                playerTrapped
                  ? 'M 254 148 C 266 147, 272 158, 270 168 C 268 179, 258 184, 249 183 C 239 182, 234 172, 236 161 C 238 151, 244 148, 254 148 Z'
                  : 'M 254 84 C 266 83, 272 94, 270 104 C 268 115, 258 120, 249 119 C 239 118, 234 108, 236 97 C 238 87, 244 84, 254 84 Z'
              }
              stroke="#111"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#faf8f2"
            />
            <path
              d={
                playerTrapped
                  ? 'M 252 183 C 250 205, 254 225, 251 246 M 252 192 C 232 178, 226 164, 222 152 M 252 192 C 272 178, 278 164, 282 152'
                  : 'M 252 119 C 254 146, 253 172, 251 196 M 252 132 C 236 146, 232 162, 228 174 M 252 132 C 268 146, 272 162, 276 174 M 251 196 C 242 216, 238 234, 234 252 M 251 196 C 260 216, 264 234, 268 252'
              }
              stroke="#111"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )}
      </g>
    </svg>
  )
}
