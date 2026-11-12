import React, { useState } from 'react'
import { HelpCircle } from 'reicon-react'

export const HelpButton: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="open help"
        title="help"
        className="flex h-7 w-7 items-center justify-center border-2 border-[#111] bg-[#fef08a] text-[#111] shadow-[2px_2px_0px_#111] transition-opacity duration-150 hover:opacity-70"
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
              <h2
                id="help-title"
                className="font-hand text-2xl leading-tight sm:text-3xl"
              >
                help
              </h2>
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
                  from the left. at 0 hearts, game over.
                </li>
                <li>
                  post a 0.5 NEAR bail bond to revive with 3 hearts, or reset to
                  stage 1 for free.
                </li>
                <li>
                  stage 7 has no buttons: connect a wallet and talk the warden
                  into signing the release. each failed attempt burns one heart.
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  )
}