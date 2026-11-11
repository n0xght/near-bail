import React from 'react'
import { HintButton } from './HintButton'

interface BottomStatusBarProps {
  stage: number
  vaultNear: string
  bondNear: string
  patchedCount: number
  hint: string
  redactVault?: boolean
}

const Divider = () => (
  <span aria-hidden="true" className="text-[#bbb]">
    |
  </span>
)

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  stage,
  vaultNear,
  bondNear,
  patchedCount,
  hint,
  redactVault = false,
}) => {
  const bondVal = parseFloat(bondNear || '0')
  const retriesLeft = Math.max(0, Math.round(bondVal / 0.1))
  const mode = bondVal >= 0.1 ? 'bonded run' : 'free run'

  return (
    <footer className="sticky bottom-0 z-40 w-full border-t-2 border-[#111] bg-[#f7f4eb] font-mono text-[10px] text-[#111] sm:text-xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] sm:gap-3">
          <span title="live vault balance read from get_vault_state">
            <span className="text-[#666]">vault</span>{' '}
            <strong data-testid="live-vault-balance">
              {redactVault ? '████' : vaultNear}
            </strong>{' '}
            NEAR
          </span>
          <Divider />
          <span title={`${retriesLeft} retries left on the current bond`}>
            <span className="text-[#666]">bond</span>{' '}
            <strong>{bondNear}</strong> NEAR
            <span className="ml-1 text-[#666]">({retriesLeft} retries)</span>
          </span>
          <Divider />
          <span>
            <span className="text-[#666]">patched</span>{' '}
            <strong>{patchedCount}</strong>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[#666] sm:inline">{mode}</span>
          <HintButton hint={hint} stage={stage} />
        </div>
      </div>
    </footer>
  )
}