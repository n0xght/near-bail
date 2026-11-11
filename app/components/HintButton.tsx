import React, { useEffect, useState } from 'react'

interface HintButtonProps {
  hint: string
  stage: number
}

/**
 * Shared, on-demand hint control. One instance lives in the sticky footer and
 * swaps its revealed copy as the stage changes.
 */
export const HintButton: React.FC<HintButtonProps> = ({ hint, stage }) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [stage])

  return (
    <div className="relative shrink-0">
      {open && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full right-0 z-50 mb-2 w-[min(18rem,calc(100vw-2rem))] border-2 border-[#111] bg-[#fef08a] px-3 py-2 text-[11px] leading-relaxed text-[#111] shadow-[3px_3px_0px_#111]"
        >
          <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#555]">
            hint · stage {stage}
          </span>
          {hint}
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-label="show a hint for this stage"
        onClick={() => setOpen((value) => !value)}
        className="border-2 border-[#111] bg-[#fef08a] px-2 py-0.5 font-mono text-[10px] font-bold text-[#111] shadow-[2px_2px_0px_#111] transition-transform hover:bg-[#fde047] active:translate-x-[1px] active:translate-y-[1px]"
      >
        {open ? 'hide' : 'hint?'}
      </button>
    </div>
  )
}