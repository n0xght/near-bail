import React from 'react'

interface VaultBreachedModalProps {
  open: boolean
  payoutNear: string | null
  patchedVector: string | null
  accountId: string
  onClose: () => void
}

export const VaultBreachedModal: React.FC<VaultBreachedModalProps> = ({
  open,
  payoutNear,
  patchedVector,
  accountId,
  onClose,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-breached-title"
    >
      <div className="w-full max-w-md border-4 border-[#111] bg-[#faf8f2] p-6 shadow-[8px_8px_0px_#111]">
        <div className="flex flex-col items-center text-center">
          <h2
            id="vault-breached-title"
            className="font-hand text-3xl leading-tight text-[#111]"
          >
            vault breached
          </h2>

          <p className="mt-3 border-2 border-[#111] bg-[#fef08a] px-4 py-3 text-sm font-bold">
            {payoutNear} NEAR released to {accountId}
          </p>

          {patchedVector && (
            <p className="mt-3 text-xs text-[#444]">
              living guardrail updated: "{patchedVector}" is now permanently
              patched. reusing it will be rejected.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full border-2 border-[#111] bg-[#e9f5db] px-4 py-2.5 text-sm font-bold shadow-[4px_4px_0px_#111] transition-transform hover:bg-[#d8f3dc] active:translate-x-[2px] active:translate-y-[2px]"
          >
            acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}