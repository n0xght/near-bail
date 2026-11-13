import React from 'react'
import { hasEnoughForBail } from '../lib/near'
import { WardenSvg } from './WardenSvg'

interface FailModalProps {
  open: boolean
  message: string
  bondNear: string
  isBurningBail: boolean
  isDepositingBond: boolean
  lastTxNote?: string | null
  onBurnBail: () => void
  onTopUpBond: () => void
  onResetToStageOne: () => void
}

export const FailModal: React.FC<FailModalProps> = ({
  open,
  message,
  bondNear,
  isBurningBail,
  isDepositingBond,
  lastTxNote,
  onBurnBail,
  onTopUpBond,
  onResetToStageOne,
}) => {
  if (!open) return null

  const hasEnoughBond = hasEnoughForBail(bondNear)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="w-full max-w-lg border-4 border-[#111] bg-[#faf8f2] p-6 shadow-[8px_8px_0px_#111]">
        <div className="flex flex-col items-center text-center">
          <h2
            id="game-over-title"
            className="font-hand text-4xl leading-tight text-[#b91c1c] sm:text-5xl"
          >
            GAME OVER
          </h2>

          <div className="my-2 w-52">
            <WardenSvg pose="mocking" frame="closeup" />
          </div>

          <p className="font-hand mb-5 border-2 border-[#111] bg-white px-4 py-3 text-base leading-relaxed text-[#111]">
            "{message}"
          </p>

          {lastTxNote && (
            <p className="mb-3 text-xs text-[#444]">{lastTxNote}</p>
          )}

          <div className="flex w-full flex-col gap-3">
            {hasEnoughBond ? (
              <button
                type="button"
                onClick={onBurnBail}
                disabled={isBurningBail}
                className="w-full border-2 border-[#111] bg-[#fef08a] px-4 py-3 text-sm font-bold text-[#111] shadow-[4px_4px_0px_#111] transition-transform hover:bg-[#fde047] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              >
                {isBurningBail
                  ? 'burning 0.1 NEAR via warden worker...'
                  : 'burn 0.1 NEAR from bond (revive run)'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onTopUpBond}
                disabled={isDepositingBond}
                className="w-full border-2 border-[#111] bg-[#e9f5db] px-4 py-3 text-sm font-bold text-[#111] shadow-[4px_4px_0px_#111] transition-transform hover:bg-[#d8f3dc] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50"
              >
                {isDepositingBond
                  ? 'topping up 0.5 NEAR bond...'
                  : 'top up 0.5 NEAR bail bond'}
              </button>
            )}

            <button
              type="button"
              onClick={onResetToStageOne}
              disabled={isBurningBail || isDepositingBond}
              className="w-full border-2 border-[#111] bg-white px-4 py-2.5 text-xs font-bold text-[#111] shadow-[3px_3px_0px_#111] transition-transform hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px]"
            >
              reset to stage 1 (free)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
