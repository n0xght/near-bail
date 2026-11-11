import React from 'react'

interface HealthHeartsProps {
  health: number
  max?: number
}

const HEART_PATH =
  'M 15 27 C 5 20, 0 14, 2 8 C 4 3, 10 3, 15 8 C 20 3, 26 3, 28 8 C 30 14, 25 20, 15 27 Z'

export const HealthHearts: React.FC<HealthHeartsProps> = ({
  health,
  max = 3,
}) => (
  <svg
    viewBox={`0 0 ${max * 34} 32`}
    className="h-6 w-auto select-none overflow-visible"
    role="img"
    aria-label={`health ${health} of ${max}`}
  >
    <defs>
      <filter id="health-sketch" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05"
          numOctaves="2"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="1.2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
    <g filter="url(#health-sketch)">
      {Array.from({ length: max }, (_, index) => {
        const filled = index >= max - health
        return (
          <g
            key={index}
            transform={`translate(${index * 34 + 2} 2) rotate(${
              index % 2 === 0 ? -4 : 3
            } 15 15)`}
          >
            <path
              d={HEART_PATH}
              stroke="#111"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={filled ? '#ef4444' : '#faf8f2'}
            />
            {filled && (
              <path
                d="M 8 9 Q 11 6, 14 9"
                stroke="#111"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        )
      })}
    </g>
  </svg>
)