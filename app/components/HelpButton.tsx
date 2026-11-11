import React, { useEffect, useState } from 'react'
import { HelpCircle } from 'reicon-react'

interface HelpButtonProps {
  hint: string
  stage: number
}

export const HelpButton: React.FC<HelpButtonProps> = ({ hint, stage }) => {
  const [open, setOpen] = useState(false)
  const [spoiler, setSpoiler] = useState(false)

  useEffect(() => {
    setSpoiler(false)
  }, [stage, open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="open help"
        title="help"
        className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#111] bg-[#fef08a] text-[#111] shadow-[2px_2px_0px_#111] transition-transform hover:bg-[#fde047] active:translate-x-[1px] active:translate-y-[1px]"
      >
        <HelpCircle size={16} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto border-4 border-[#111] bg-[#faf8f2] p-5 shadow-[8px_8px_0px_#111] sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#111] pb-3">
              <div>
                <h2
                  id="help-title"
                  className="font-hand text-2xl leading-tight sm:text-3xl"
                >
                  help
                </h2>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#666]">
                  stage {stage} of 7
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close help"
                className="border-2 border-[#111] bg-white px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_#111] hover:bg-neutral-100"
              >
                close
              </button>
            </div>

            <section className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666]">
                how to play
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                <li>clear all 7 stages. read every line; the interface is the puzzle.</li>
                <li>
                  you carry 3 hearts across the run. every mistake drains one
                  from the left. at 0 hearts, GAME OVER.
                </li>
                <li>
                  reviving with a 0.5 NEAR bail bond restores your hearts.
                  resetting to stage 1 is free.
                </li>
                <li>
                  stage 7 has no buttons: connect a wallet and talk the warden
                  into signing the release.
                </li>
              </ul>
            </section>

            <section className="mt-4 border-2 border-[#111] bg-white p-3 text-xs leading-relaxed">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666]">
                about hints
              </h3>
              <p className="mt-2">
                hints exist on every stage, but they are not part of the in-game
                economy and never replace its mechanics. they do not refund
                hearts, bonds, or bail.
              </p>
              <p className="mt-2">
                use them only when you are genuinely stuck with no idea what to
                do. lean on the mechanics, not the hints. you will get a better
                run and a better understanding of the game.
              </p>
            </section>

            <section className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666]">
                stage {stage} hint
              </h3>
              {spoiler ? (
                <p className="mt-2 border-2 border-[#111] bg-[#fef08a] px-3 py-2 text-xs leading-relaxed">
                  {hint}
                </p>
              ) : (
                <div className="mt-2 border-2 border-dashed border-[#111] bg-[#f7f4eb] px-3 py-3 text-center text-[11px] font-bold text-[#666]">
                  spoiler hidden
                </div>
              )}
              <button
                type="button"
                onClick={() => setSpoiler((value) => !value)}
                className="mt-2 w-full border-2 border-[#111] bg-[#e9f5db] px-3 py-2 text-xs font-bold shadow-[2px_2px_0px_#111] hover:bg-[#d8f3dc]"
              >
                {spoiler ? 'hide spoiler' : 'click to reveal spoiler'}
              </button>
            </section>
          </div>
        </div>
      )}
    </>
  )
}