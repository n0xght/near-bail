import React from 'react'
import { Wallet } from 'reicon-react'

interface TopBarProps {
  accountId: string | null
  onConnectWallet: () => void
  onDisconnectWallet: () => void
}

const GitHubMark: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 shrink-0"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
)

export const TopBar: React.FC<TopBarProps> = ({
  accountId,
  onConnectWallet,
  onDisconnectWallet,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#111] bg-[#f7f4eb] font-mono text-xs text-[#111] sm:text-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-1.5 text-base font-black tracking-tight">
          <a
            href="https://github.com/n0xght/near-bail"
            target="_blank"
            rel="noreferrer"
            aria-label="near-bail on github"
            className="flex items-center text-[#111] transition-opacity duration-150 hover:opacity-70"
          >
            <GitHubMark />
          </a>
          <span>near-bail</span>
        </div>

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
            <span>connect wallet</span>
          </button>
        )}
      </div>
    </header>
  )
}