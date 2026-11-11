import React from 'react'
import { Wallet } from 'reicon-react'

interface TopBarProps {
  accountId: string | null
  isDepositingBond: boolean
  onPostBond: () => void
  onConnectWallet: () => void
  onDisconnectWallet: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  accountId,
  isDepositingBond,
  onPostBond,
  onConnectWallet,
  onDisconnectWallet,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#111] bg-[#f7f4eb] font-mono text-xs text-[#111] sm:text-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <span className="text-base font-black tracking-tight">near-bail</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPostBond}
            disabled={isDepositingBond}
            title="post 0.5 NEAR bail bond (5 instant retries)"
            className="border-2 border-[#111] bg-[#e9f5db] px-2.5 py-1 font-bold text-[#111] shadow-[2px_2px_0px_#111] transition-transform hover:bg-[#d8f3dc] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
          >
            {isDepositingBond ? 'posting...' : '+ 0.5 NEAR'}
          </button>

          {accountId ? (
            <button
              type="button"
              onClick={onDisconnectWallet}
              title="click to disconnect wallet"
              className="flex max-w-[10rem] items-center gap-1.5 border-2 border-[#111] bg-white px-2.5 py-1 text-[#111] shadow-[2px_2px_0px_#111]"
            >
              <Wallet size={14} className="shrink-0" />
              <span className="truncate">{accountId}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              title="connect testnet wallet"
              className="flex items-center gap-1.5 border-2 border-[#111] bg-white px-2.5 py-1 font-bold text-[#111] shadow-[2px_2px_0px_#111] transition-transform hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Wallet size={14} />
              <span>connect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}