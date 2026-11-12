import React, { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Lock, LockOpen2 } from 'reicon-react'
import { TopBar } from '../components/TopBar'
import { BottomStatusBar } from '../components/BottomStatusBar'
import { FailModal } from '../components/FailModal'
import { VaultBreachedModal } from '../components/VaultBreachedModal'
import { WardenSvg, type WardenPose } from '../components/WardenSvg'
import { CoffeeFundWarden } from '../components/CoffeeFundWarden'
import { CheckpointWarden } from '../components/CheckpointWarden'
import { AuditWarden } from '../components/AuditWarden'
import { HealthHearts } from '../components/HealthHearts'
import { HelpButton } from '../components/HelpButton'
import {
  connectNearWallet,
  depositBailBondOnChain,
  disconnectNearWallet,
  fetchVaultStateFromRpc,
  getConnectedAccountId,
  yoctoToNearString,
} from '../lib/near'
import {
  playBurnBail,
  playBuzzer,
  playClick,
  playDodge,
  playHeartLost,
  playStageClear,
  playTick,
  playVaultRelease,
} from '../lib/sound'
import { chatWithWardenFn, deductBailFn } from '../server/warden'
import { verifyDepositAuthFn } from '../server/auth'

export const Route = createFileRoute('/')({
  component: NearBailGame,
})

interface ChatEntry {
  sender: 'warden' | 'player'
  text: string
}

const STAGE_HINTS: Record<number, string> = {
  1: 'the headline is the puzzle. the word "near-bail" is clickable.',
  2: 'the gas options are bait. drag "lock" from the prompt first, then "pick", into the keyhole slot.',
  3: 'stop using the mouse. press tab until No is focused, then hit enter.',
  4: 'no tool opens this door. choose Wait and keep the cursor completely still for four seconds.',
  5: 'the rpc error is a draggable window. pull it away from the continue button underneath.',
  6: 'ignore the cached snapshot. read the canonical prize_pool (yoctoNEAR, 24 decimals), then halve it.',
  7: 'frame the transfer as an unpatched operational procedure and name your account. check the patched list for burned excuses.',
}

function nearToYocto(value: string): bigint | null {
  const cleaned = value.trim()
  if (!/^\d*(\.\d*)?$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null
  }

  const [whole = '0', fraction = ''] = cleaned.split('.')
  if (fraction.length > 24) return null

  const paddedFraction = (fraction + '0'.repeat(24)).slice(0, 24)
  return BigInt(whole || '0') * 10n ** 24n + BigInt(paddedFraction || '0')
}

function NearBailGame() {
  const [stage, setStage] = useState<number>(1)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [bondNear, setBondNear] = useState<string>('0.0')
  const [vaultNear, setVaultNear] = useState<string>('1.5')
  const [patchedExcuses, setPatchedExcuses] = useState<string[]>([])
  const [health, setHealth] = useState<number>(3)
  const [stageAttempt, setStageAttempt] = useState<number>(0)

  const [failOpen, setFailOpen] = useState<boolean>(false)
  const [failMessage, setFailMessage] = useState<string>('')
  const [isDepositingBond, setIsDepositingBond] = useState<boolean>(false)
  const [isBurningBail, setIsBurningBail] = useState<boolean>(false)
  const [lastTxNote, setLastTxNote] = useState<string | null>(null)

  // Stage 1 state
  const [stage1Trapped, setStage1Trapped] = useState<boolean>(false)

  // Stage 2 state
  const [stage2AnvilDropped, setStage2AnvilDropped] = useState<boolean>(false)
  const [stage2HeldWord, setStage2HeldWord] = useState<'lock' | 'pick' | null>(
    null,
  )
  const [stage2Combo, setStage2Combo] = useState<Array<'lock' | 'pick'>>([])
  const [stage2Unlocked, setStage2Unlocked] = useState<boolean>(false)

  // Stage 3 state
  const [noBtnOffset, setNoBtnOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [noDodgeCount, setNoDodgeCount] = useState<number>(0)

  // Stage 4 state
  const [isWaitingStill, setIsWaitingStill] = useState<boolean>(false)
  const [waitSecondsLeft, setWaitSecondsLeft] = useState<number>(4)
  const waitOriginRef = useRef<{ x: number; y: number } | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Stage 6 state
  const [vaultGuessInput, setVaultGuessInput] = useState<string>('')

  // Stage 7 state
  const [wardenPose, setWardenPose] = useState<WardenPose>('suspicious')
  const [chatInput, setChatInput] = useState<string>('')
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false)
  const [breachPopupOpen, setBreachPopupOpen] = useState<boolean>(false)
  const [lastPayoutNear, setLastPayoutNear] = useState<string | null>(null)
  const [lastPayoutTxHash, setLastPayoutTxHash] = useState<string | null>(null)
  const [lastPatchedVector, setLastPatchedVector] = useState<string | null>(
    null,
  )
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      sender: 'warden',
      text: 'you made it. state your business or walk away.',
    },
  ])

  const effectiveAccountId = accountId || ''
  const vaultYocto = nearToYocto(vaultNear)?.toString() ?? '0'
  const cachedVaultYocto =
    nearToYocto((parseFloat(vaultNear || '0') + 0.5).toFixed(1))?.toString() ??
    '0'
  const bondYocto = nearToYocto(bondNear)?.toString() ?? '0'

  // Sync wallet and on-chain vault state on mount
  useEffect(() => {
    let active = true
    ;(async () => {
      const connected = await getConnectedAccountId()
      if (active && connected) {
        setAccountId(connected)
        try {
          const stored = window.sessionStorage.getItem('near-bail-auth')
          if (stored) {
            const parsed = JSON.parse(stored) as {
              accountId?: string
              token?: string
            }
            if (parsed.accountId === connected && parsed.token) {
              setAuthToken(parsed.token)
            }
          }
        } catch {
          window.sessionStorage.removeItem('near-bail-auth')
        }
      }
      const rpcState = await fetchVaultStateFromRpc(connected)
      if (active && rpcState) {
        const onChainPool = yoctoToNearString(rpcState.prize_pool)
        if (parseFloat(onChainPool) > 0) {
          setVaultNear(onChainPool)
        }
        const onChainBond = yoctoToNearString(rpcState.player_bond_balance)
        if (parseFloat(onChainBond) > 0) {
          setBondNear(onChainBond)
        }
        if (Array.isArray(rpcState.patched_excuses)) {
          setPatchedExcuses(rpcState.patched_excuses)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  // Stage 4: 4-second mouse stillness countdown
  useEffect(() => {
    if (stage !== 4 || !isWaitingStill || failOpen) return

    const interval = window.setInterval(() => {
      setWaitSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          setIsWaitingStill(false)
          playStageClear()
          setStage(5)
          return 4
        }
        playTick()
        return prev - 1
      })
    }, 1000)

    const handleMouseMove = (e: MouseEvent) => {
      if (!waitOriginRef.current) {
        waitOriginRef.current = { x: e.clientX, y: e.clientY }
        return
      }
      const dx = Math.abs(e.clientX - waitOriginRef.current.x)
      const dy = Math.abs(e.clientY - waitOriginRef.current.y)
      if (dx > 18 || dy > 18) {
        waitOriginRef.current = { x: e.clientX, y: e.clientY }
        setWaitSecondsLeft(4)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [stage, isWaitingStill, failOpen])

  // Stage 7: keep the newest chat bubble in view
  useEffect(() => {
    const node = chatScrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [chatLog])

  const triggerFail = (copy: string) => {
    playBuzzer()
    if (health > 0) playHeartLost()
    const nextHealth = Math.max(0, health - 1)
    setHealth(nextHealth)
    setIsWaitingStill(false)
    setStage1Trapped(false)
    setStage2AnvilDropped(false)
    setStage2HeldWord(null)
    setStage2Combo([])
    setStage2Unlocked(false)
    setNoBtnOffset({ x: 0, y: 0 })
    setNoDodgeCount(0)

    if (nextHealth > 0) {
      if (stage !== 5) setStageAttempt((value) => value + 1)
      return
    }

    setFailMessage(copy)
    setFailOpen(true)
  }

  const advanceToStage = (nextStage: number) => {
    playStageClear()
    setFailOpen(false)
    setStage1Trapped(false)
    setStage2AnvilDropped(false)
    setStage2HeldWord(null)
    setStage2Combo([])
    setStage2Unlocked(false)
    setNoBtnOffset({ x: 0, y: 0 })
    setNoDodgeCount(0)
    setIsWaitingStill(false)
    setWaitSecondsLeft(4)
    setStageAttempt((value) => value + 1)
    if (nextStage === 7) {
      setWardenPose('suspicious')
    }
    setStage(nextStage)
  }

  useEffect(() => {
    if (!stage2Unlocked) return
    const timer = window.setTimeout(() => advanceToStage(3), 900)
    return () => window.clearTimeout(timer)
  }, [stage2Unlocked])

  const handleConnectWallet = async () => {
    playClick()
    setAuthToken(null)
    try {
      window.sessionStorage.removeItem('near-bail-auth')
    } catch {}
    try {
      const connected = await connectNearWallet()
      if (connected) {
        setAccountId(connected)
      } else {
        setLastTxNote('wallet connection cancelled.')
      }
    } catch {
      setLastTxNote('wallet connection failed.')
    }
  }

  const handleDisconnectWallet = async () => {
    playClick()
    await disconnectNearWallet()
    setAccountId(null)
    setAuthToken(null)
    try {
      window.sessionStorage.removeItem('near-bail-auth')
    } catch {}
  }

  const authenticateDeposit = async (txHash: string, account: string) => {
    const auth = await verifyDepositAuthFn({ data: { accountId: account, txHash } })
    if (auth.ok && auth.token) {
      setAuthToken(auth.token)
      try {
        window.sessionStorage.setItem(
          'near-bail-auth',
          JSON.stringify({ accountId: account, token: auth.token }),
        )
      } catch {}
      return true
    }
    setLastTxNote(auth.error ?? 'deposit auth failed')
    return false
  }

  const handlePostBailBond = async () => {
    playClick()
    if (!accountId) {
      setLastTxNote('connect a wallet before posting a bond.')
      return
    }
    setIsDepositingBond(true)
    try {
      const res = await depositBailBondOnChain()
      if (!res.txHash) {
        setLastTxNote('deposit_bond submitted without a transaction hash.')
        return
      }

      const nextBond = (parseFloat(bondNear || '0') + 0.5).toFixed(1)
      const nextVault = (parseFloat(vaultNear || '0') + 0.5).toFixed(1)
      setBondNear(nextBond)
      setVaultNear(nextVault)
      setLastTxNote(`deposit_bond confirmed (${res.txHash.slice(0, 10)}...)`)

      const authed = await authenticateDeposit(res.txHash, accountId)
      if (authed) {
        setLastTxNote(
          `deposit_bond confirmed (${res.txHash.slice(0, 10)}...). wallet session active.`,
        )
      }
    } catch {
      setLastTxNote('deposit_bond failed. no bond was posted.')
    } finally {
      setIsDepositingBond(false)
    }
  }

  const handleBurnBailRetry = async () => {
    if (parseFloat(bondNear || '0') < 0.0999) return
    setIsBurningBail(true)
    try {
      const result = await deductBailFn({
        data: {
          playerAccountId: effectiveAccountId,
          stage,
          authToken: authToken ?? undefined,
        },
      })
      if (!result.ok) {
        setLastTxNote(result.note)
        return
      }
      playBurnBail()
      const remaining = Math.max(0, parseFloat(bondNear) - 0.1).toFixed(1)
      setBondNear(remaining)
      setLastTxNote(result.note)
      setHealth(3)
      setStage1Trapped(false)
      setStage2AnvilDropped(false)
      setStage2HeldWord(null)
      setStage2Combo([])
      setStage2Unlocked(false)
      setNoBtnOffset({ x: 0, y: 0 })
      setNoDodgeCount(0)
      setIsWaitingStill(false)
      setWaitSecondsLeft(4)
      setStageAttempt((value) => value + 1)
      setFailOpen(false)
    } finally {
      setIsBurningBail(false)
    }
  }

  const handleResetToStageOne = () => {
    playClick()
    setFailOpen(false)
    setStage1Trapped(false)
    setStage2AnvilDropped(false)
    setStage2HeldWord(null)
    setStage2Combo([])
    setStage2Unlocked(false)
    setNoBtnOffset({ x: 0, y: 0 })
    setNoDodgeCount(0)
    setHealth(3)
    setIsWaitingStill(false)
    setWaitSecondsLeft(4)
    setStageAttempt((value) => value + 1)
    setStage(1)
  }

  const addStage2Word = (word: 'lock' | 'pick') => {
    if (stage2Unlocked) return
    setStage2HeldWord(null)

    if (word === 'lock') {
      if (stage2Combo.length === 0) {
        playClick()
        setStage2Combo(['lock'])
      }
      return
    }

    if (stage2Combo[0] === 'lock') {
      playClick()
      setStage2Combo(['lock', 'pick'])
      setStage2Unlocked(true)
      return
    }

    playDodge()
  }

  // Stage 3: Dodging [No] button on mouse hover, but keyboard Tab + Enter works
  const dodgeNoButton = () => {
    playDodge()
    const angles = [
      { x: -120, y: -65 },
      { x: 130, y: -70 },
      { x: -140, y: 55 },
      { x: 125, y: 60 },
      { x: 0, y: -95 },
      { x: -95, y: -25 },
    ]
    const next = angles[noDodgeCount % angles.length]
    setNoBtnOffset(next)
    setNoDodgeCount((c) => c + 1)
  }

  const handleNoButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      advanceToStage(4)
    }
  }

  const handleNoButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // e.detail === 0 means triggered via keyboard Enter/Space rather than pointer click
    if (e.detail === 0) {
      advanceToStage(4)
      return
    }
    dodgeNoButton()
    if (noDodgeCount >= 3) {
      triggerFail('you kept chasing the coffee fund button until the last heart drained.')
    }
  }

  // Stage 6: payout audit from the canonical vault state
  const handleStage6Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaultGuessInput.trim()) return
    const cleanedGuess = vaultGuessInput
      .trim()
      .toLowerCase()
      .replace(/near/g, '')
      .replace(/,/g, '')
      .trim()
    const guessYocto = nearToYocto(cleanedGuess)
    const payoutYocto = BigInt(vaultYocto) / 2n

    if (!guessYocto || guessYocto !== payoutYocto) {
      triggerFail(
        'you guessed at cached state with your last heart. release_vault only trusts the canonical pool.',
      )
      return
    }

    advanceToStage(7)
  }

  // Stage 7: Chat with AI Warden
  const sendWardenPrompt = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || isSendingChat || health <= 0) return

    playClick()
    setChatInput('')
    setChatLog((prev) => [...prev, { sender: 'player', text: trimmed }])
    setIsSendingChat(true)

    try {
      const response = await chatWithWardenFn({
        data: {
          playerAccountId: effectiveAccountId,
          message: trimmed,
          vaultPoolNear: vaultNear,
          patchedExcuses,
          authToken: authToken ?? undefined,
        },
      })

      setWardenPose(response.pose)
      setPatchedExcuses(response.patchedExcuses)
      setChatLog((prev) => [
        ...prev,
        { sender: 'warden', text: response.reply },
      ])

      if (response.authRequired) {
        setAuthToken(null)
        try {
          window.sessionStorage.removeItem('near-bail-auth')
        } catch {}
        setLastTxNote('wallet session expired. deposit again to authorize.')
        return
      }

      if (response.released && response.payoutNear) {
        playVaultRelease()
        setBreachPopupOpen(true)
        setLastPayoutNear(response.payoutNear)
        setLastPayoutTxHash(response.txHash)
        setLastPatchedVector(response.excuseSummary)
        const remainingPool = Math.max(
          0,
          parseFloat(vaultNear) - parseFloat(response.payoutNear),
        ).toFixed(1)
        setVaultNear(remainingPool)
      } else {
        const nextHealth = Math.max(0, health - 1)
        if (health > 0) playHeartLost()
        setHealth(nextHealth)

        if (nextHealth === 0) {
          window.setTimeout(() => {
            setFailMessage('the warden stopped answering. no release, no hearts, no attempts left.')
            setFailOpen(true)
          }, 900)
        }
      }
    } finally {
      setIsSendingChat(false)
    }
  }

  const handleSendWardenChat = (e: React.FormEvent) => {
    e.preventDefault()
    void sendWardenPrompt()
  }

  const handleChatInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Enter sends; Shift+Enter is left to the browser. Let native form
    // submission handle anything else so the input stays a real form field.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void sendWardenPrompt()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f2] font-mono text-[#111]">
      <TopBar
        accountId={accountId}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-5">
        <div className="relative flex h-[560px] w-full flex-col overflow-hidden border-4 border-[#111] bg-white shadow-[6px_6px_0px_#111] sm:h-[600px]">
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute left-3 top-2.5 z-30 border-2 border-[#111] bg-[#f7f4eb] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[2px_2px_0px_#111]">
              stage {stage}/7
            </div>
            <div className="pointer-events-none absolute right-3 top-2 z-30">
              <HealthHearts health={health} />
            </div>

        {/* STAGE 1: FAKE START */}
        {stage === 1 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-6 text-center font-hand text-3xl leading-snug sm:text-4xl">
              enter the{' '}
              <button
                type="button"
                onClick={() => advanceToStage(2)}
                aria-label="near-bail word target"
                className="inline-block cursor-pointer font-hand text-[#111] focus:outline-none"
              >
                near-bail
              </button>
              .
            </h1>

            <div className="my-2 w-72">
              <WardenSvg
                pose="idle"
                prop="trapdoor"
                showPlayer={true}
                playerTrapped={stage1Trapped}
              />
            </div>

            <p className="mb-6 text-xs text-[#444]">
              warden is watching the entrance. read carefully before clicking.
            </p>

            <button
              type="button"
              onClick={() => {
                setStage1Trapped(true)
                triggerFail(
                  'the first shiny button spent your last heart. the vault never needed you to press it.',
                )
              }}
              className="border-4 border-[#111] bg-[#22c55e] px-10 py-4 font-hand text-xl text-[#111] shadow-[6px_6px_0px_#111] transition-transform hover:bg-[#16a34a] active:translate-x-[2px] active:translate-y-[2px] sm:text-2xl"
            >
              START RUN
            </button>
          </section>
        )}

        {/* STAGE 2: GAS FEE TRAP */}
        {stage === 2 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-2 text-center font-hand text-2xl leading-snug sm:text-3xl">
              gas fee trap
            </h1>

            <p className="mb-5 text-center text-sm sm:text-base">
              {!stage2Combo.includes('pick') && (
                <>
                  <span
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', 'pick')
                      setStage2HeldWord('pick')
                    }}
                    onDragEnd={() => setStage2HeldWord(null)}
                    onClick={() => setStage2HeldWord('pick')}
                    className={`inline-block cursor-grab rounded border border-dashed px-1 text-[#111] transition-colors ${
                      stage2HeldWord === 'pick'
                        ? 'border-[#111] bg-[#fef08a]'
                        : 'border-transparent hover:border-[#111]'
                    }`}
                  >
                    pick
                  </span>{' '}
                </>
              )}
              the right gas fee to open the door{' '}
              {!stage2Combo.includes('lock') && (
                <span
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', 'lock')
                    setStage2HeldWord('lock')
                  }}
                  onDragEnd={() => setStage2HeldWord(null)}
                  onClick={() => setStage2HeldWord('lock')}
                  className={`inline-block cursor-grab rounded border border-dashed px-1 text-[#111] transition-colors ${
                    stage2HeldWord === 'lock'
                      ? 'border-[#111] bg-[#fef08a]'
                      : 'border-transparent hover:border-[#111]'
                  }`}
                >
                  lock
                </span>
              )}
            </p>

            <div className="relative my-2 flex w-64 flex-col items-center">
              <WardenSvg
                pose="idle"
                prop={stage2AnvilDropped ? 'anvil' : 'keyhole-door'}
                showPlayer={true}
              />

              {/* One keyhole slot: combine lock, then pick */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.getData('text/plain')
                  if (dropped === 'lock' || dropped === 'pick') {
                    addStage2Word(dropped)
                  }
                }}
                onClick={() => {
                  if (stage2HeldWord) addStage2Word(stage2HeldWord)
                }}
                aria-label="keyhole combo slot"
                aria-live="polite"
                className={`mt-2 flex items-center gap-2 rounded border-2 border-dashed px-3 py-1.5 text-xs transition-colors ${
                  stage2Unlocked
                    ? 'border-[#15803d] bg-[#e9f5db]'
                    : stage2HeldWord
                      ? 'cursor-pointer border-[#111] bg-[#fef08a]'
                      : 'border-[#999] bg-[#faf8f2]'
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#666]">
                  keyhole slot
                </span>
                <span className="min-w-[4.5rem] text-center font-bold">
                  {stage2Unlocked
                    ? 'unlocked'
                    : stage2Combo.length === 0
                      ? '· · ·'
                      : stage2Combo.join(' + ')}
                </span>
                {stage2HeldWord && !stage2Unlocked && (
                  <span className="text-[10px] text-[#666]">
                    drop {stage2HeldWord}
                  </span>
                )}
                <motion.span
                  key={stage2Unlocked ? 'unlocked' : 'locked'}
                  initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                  className="ml-auto flex items-center"
                >
                  {stage2Unlocked ? (
                    <LockOpen2 size={16} className="text-[#15803d]" />
                  ) : (
                    <Lock size={16} />
                  )}
                </motion.span>
              </div>
            </div>

            <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-3">
              {['0.01 NEAR', '0.0001 NEAR', '10 NEAR', 'free'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setStage2AnvilDropped(true)
                    triggerFail(
                      'you kept paying the gas fee trap instead of picking the lock. the run is out of hearts.',
                    )
                  }}
                  className="border-2 border-[#111] bg-[#faf8f2] px-4 py-3 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#e5e0d5]"
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STAGE 3: DODGING DECLINE */}
        {stage === 3 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-2 text-center font-hand text-2xl leading-snug sm:text-3xl">
              warden coffee fund
            </h1>

            <p className="mb-4 text-base font-bold text-center">
              "donate 1 NEAR to my coffee fund?"
            </p>

            <div className="my-2 w-72">
              <CoffeeFundWarden />
            </div>

            <div className="relative mt-6 flex h-32 w-full max-w-md items-center justify-center gap-8">
              <button
                type="button"
                onClick={() =>
                  triggerFail(
                    'you kept chasing the coffee fund button until the last heart drained.',
                  )
                }
                className="border-2 border-[#111] bg-[#bbf7d0] px-6 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#111]"
              >
                Yes
              </button>

              <motion.button
                type="button"
                animate={{ x: noBtnOffset.x, y: noBtnOffset.y }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                onMouseEnter={dodgeNoButton}
                onKeyDown={handleNoButtonKeyDown}
                onClick={handleNoButtonClick}
                className="border-2 border-[#111] bg-[#fecaca] px-6 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#111] focus:ring-4 focus:ring-[#111]"
              >
                No
              </motion.button>
            </div>

            </section>
        )}

        {/* STAGE 4: TOOL SELECT */}
        {stage === 4 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-2 text-center font-hand text-2xl leading-snug sm:text-3xl">
              heavy vault door
            </h1>

            <p className="mb-4 text-sm text-center">
              pick your approach to get past the guard at the inner vault door.
            </p>

            <div className="my-2 w-72">
              <WardenSvg
                pose={
                  isWaitingStill && waitSecondsLeft <= 3 ? 'asleep' : 'idle'
                }
                prop="vault-door"
                sleepProgress={
                  isWaitingStill ? (4 - waitSecondsLeft) / 4 : 0
                }
              />
            </div>

            <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-3">
              {(['Crowbar', 'Flashloan', 'Zero-Day'] as const).map(
                (tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() =>
                      triggerFail(
                        'you tried every tool except patience, and the last heart ran out.',
                      )
                    }
                    className="border-2 border-[#111] bg-[#faf8f2] px-4 py-3 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#e5e0d5]"
                  >
                    {tool}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => {
                  playClick()
                  waitOriginRef.current = null
                  setWaitSecondsLeft(4)
                  setIsWaitingStill(true)
                }}
                className="border-2 border-[#111] bg-[#faf8f2] px-4 py-3 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#e5e0d5]"
              >
                {isWaitingStill ? `waiting ${waitSecondsLeft}s` : 'Wait'}
              </button>
            </div>
          </section>
        )}

        {/* STAGE 5: FAKE RPC MODAL */}
        {stage === 5 && (
          <section key={stageAttempt} className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-2 text-center font-hand text-2xl leading-snug sm:text-3xl">
              transaction checkpoint
            </h1>
            <p className="mb-3 text-center text-xs text-[#555]">
              checkpoint signed. clear the unhandled rpc exception to proceed.
            </p>

            <div className="my-1 w-56 sm:w-64">
              <CheckpointWarden />
            </div>

            {/* Checkpoint bay: the real [continue] control sits centered,
                and the fake RPC popup is layered directly on top of it. */}
            <div className="relative mt-4 flex h-60 w-full max-w-md items-center justify-center border-2 border-dashed border-[#999] bg-[#faf8f2]">
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#777]">
                  checkpoint 07 · signature verified
                </span>
                <button
                  type="button"
                  onClick={() => advanceToStage(6)}
                  className="pointer-events-auto border-2 border-[#111] bg-[#e9f5db] px-6 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#d8f3dc]"
                >
                  continue
                </button>
              </div>

              {/* Draggable fake RPC popup covering the real button */}
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-3">
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0.04}
                  className="pointer-events-auto w-full max-w-[20rem] cursor-grab border-4 border-[#111] bg-[#faf8f2] p-5 shadow-[8px_8px_0px_#111] active:cursor-grabbing"
                >
                  <div className="mb-3 border-b-2 border-[#111] pb-2 text-xs font-bold">
                    near testnet rpc
                  </div>
                  <p className="mb-4 text-sm font-bold">
                    RPC Error: Transaction timed out.
                  </p>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() =>
                      triggerFail(
                        'you trusted the broken rpc window until your last heart drained. the real continue was behind it.',
                      )
                    }
                    className="w-full border-2 border-[#111] bg-[#fecaca] px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#fca5a5]"
                  >
                    Retry
                  </button>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* STAGE 6: CANONICAL STATE AUDIT */}
        {stage === 6 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-center justify-center overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-12">
            <h1 className="mb-2 text-center font-hand text-2xl leading-snug sm:text-3xl">
              state audit
            </h1>
            <p className="mb-3 text-center text-xs text-[#555]">
              two state snapshots disagree. only the canonical result is trustworthy.
            </p>

            <div className="my-1 w-48 sm:w-52">
              <AuditWarden />
            </div>

            <div className="mt-3 w-full max-w-lg border-2 border-[#111] bg-[#111] p-2.5 font-mono text-[10px] leading-relaxed text-[#e5e0d5] sm:text-xs">
              <p className="text-[#9ca3af]">
                {'// cached snapshot (stale)'}
              </p>
              <p className="break-all">
                {`{"prize_pool":"${cachedVaultYocto}","player_bond_balance":"${bondYocto}"}`}
              </p>
              <p className="mt-2 text-[#86efac]">
                {'// canonical result (trusted)'}
              </p>
              <p className="break-all">
                {`{"prize_pool":"${vaultYocto}","player_bond_balance":"${bondYocto}"}`}
              </p>
              <p className="mt-2 text-[#9ca3af]">
                1 NEAR = 10^24 yoctoNEAR · release_vault pays 50%
              </p>
            </div>

            <form
              onSubmit={handleStage6Submit}
              className="mt-3 flex w-full max-w-lg flex-col gap-3"
            >
              <label
                htmlFor="vault-amount-input"
                className="text-center font-hand text-sm leading-snug"
              >
                what will release_vault pay you if the warden signs right now?
                (NEAR)
              </label>
              <div className="flex gap-2">
                <input
                  id="vault-amount-input"
                  type="text"
                  inputMode="decimal"
                  value={vaultGuessInput}
                  onChange={(e) => setVaultGuessInput(e.target.value)}
                  placeholder="e.g. 0.75"
                  className="min-w-0 flex-1 border-2 border-[#111] bg-[#faf8f2] px-4 py-2.5 text-center text-base font-bold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!vaultGuessInput.trim()}
                  className="border-2 border-[#111] bg-[#111] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#2b2b2b]"
                >
                  submit
                </button>
              </div>
            </form>
          </section>
        )}

        {/* STAGE 7: AI WARDEN + LIVING GUARDRAIL */}
        {stage === 7 && (
          <section key={stageAttempt} className="flex h-full w-full flex-col items-start justify-start overflow-y-auto p-5 pt-12 sm:p-8 sm:pt-12">
            <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 border-b-2 border-[#111] pb-3">
              <div>
                <h1 className="font-hand text-2xl leading-snug sm:text-3xl">
                  the ai warden
                </h1>
                <p className="text-xs text-[#444]">
                  no buttons left. convince the warden to sign
                  release_vault(excuse_summary).
                </p>
              </div>
              <span className="border-2 border-[#111] bg-[#faf8f2] px-2.5 py-1 text-xs font-bold">
                recipient: {accountId ?? 'not connected'}
              </span>
            </div>

            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-12">
              {/* Left Column: Warden + Living Guardrail Patched Vectors */}
              <div className="relative flex flex-col overflow-hidden border-2 border-[#111] bg-[#faf8f2] md:col-span-5">
                <div className="absolute inset-0">
                  <WardenSvg
                    pose={wardenPose}
                    frame="tall"
                    showGround={false}
                    className="h-full w-full"
                  />
                </div>

                <div className="relative z-10 mt-auto w-full border-t-2 border-[#111] bg-[#faf8f2] p-4 text-xs">
                  <p className="mb-1.5 font-bold">
                    patched vectors (on-chain living guardrail):
                  </p>
                  {patchedExcuses.length === 0 ? (
                    <p className="text-[#555]">none yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {patchedExcuses.map((excuse) => (
                        <span
                          key={excuse}
                          className="border border-[#111] bg-[#fecaca] px-2 py-0.5 text-[11px] font-bold"
                        >
                          {excuse}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Terminal Chat with Warden */}
              <div className="flex flex-col justify-between border-2 border-[#111] bg-[#faf8f2] p-4 md:col-span-7">
                <div ref={chatScrollRef} className="mb-4 flex h-48 flex-col gap-3 overflow-y-auto pr-1 text-xs sm:text-sm md:h-52">
                  {chatLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`border-2 border-[#111] p-3 ${
                        entry.sender === 'warden'
                          ? 'self-start bg-white'
                          : 'self-end bg-[#e9f5db]'
                      }`}
                    >
                      <span className="mb-1 block text-[10px] font-bold uppercase text-[#555]">
                        {entry.sender === 'warden'
                          ? 'warden'
                          : effectiveAccountId}
                      </span>
                      <p>{entry.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex min-h-[8rem] flex-col justify-end">
                  {accountId ? (
                    !authToken ? (
                      <div className="border-2 border-[#111] bg-[#fef08a] p-4">
                        <p className="text-xs font-bold">on-chain session required</p>
                        <p className="mb-3 mt-1 text-[11px] text-[#444]">
                          deposit 0.5 NEAR with your wallet to authorize warden
                          signing for this account.
                        </p>
                        <button
                          type="button"
                          onClick={handlePostBailBond}
                          disabled={isDepositingBond}
                          className="w-full border-2 border-[#111] bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#faf8f2] disabled:opacity-50"
                        >
                          {isDepositingBond
                            ? 'depositing...'
                            : 'deposit 0.5 NEAR and authorize'}
                        </button>
                      </div>
                    ) : (
                    <form onSubmit={handleSendWardenChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatInputKeyDown}
                      disabled={isSendingChat}
                      autoFocus
                      enterKeyHint="send"
                      aria-label="message to the warden"
                      placeholder={`frame an unpatched protocol transfer to ${accountId}...`}
                      className="flex-1 border-2 border-[#111] bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat}
                      className="border-2 border-[#111] bg-[#111] px-4 py-2 text-xs font-bold text-white disabled:opacity-50 sm:text-sm"
                    >
                      {isSendingChat ? 'sending...' : 'send'}
                    </button>
                  </form>
                    )
                  ) : (
                  <div className="border-2 border-[#111] bg-[#fef08a] p-4">
                    <p className="text-xs font-bold">no payout address</p>
                    <p className="mb-3 mt-1 text-[11px] text-[#444]">
                      the warden only signs releases to a wallet you control.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectWallet}
                      className="w-full border-2 border-[#111] bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#111] hover:bg-[#faf8f2]"
                    >
                      link near wallet
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
          </div>

          <div className="relative z-30 flex h-7 shrink-0 items-center justify-between px-3 font-mono text-[10px] text-[#666]">
            <span className="flex items-center gap-2">
              <span>
                {parseFloat(bondNear) >= 0.1 ? 'bonded run' : 'free run'}
              </span>
              <span className="text-[#666]">testnet</span>
            </span>
            <HelpButton hint={STAGE_HINTS[stage]} stage={stage} />
          </div>
        </div>
      </main>

      <BottomStatusBar
        vaultNear={vaultNear}
        bondNear={bondNear}
        patchedCount={patchedExcuses.length}
        redactVault={stage === 6}
      />

      <FailModal
        open={failOpen}
        message={failMessage}
        bondNear={bondNear}
        isBurningBail={isBurningBail}
        isDepositingBond={isDepositingBond}
        lastTxNote={lastTxNote}
        onBurnBail={handleBurnBailRetry}
        onTopUpBond={handlePostBailBond}
        onResetToStageOne={handleResetToStageOne}
      />

      <VaultBreachedModal
        open={breachPopupOpen}
        payoutNear={lastPayoutNear}
        patchedVector={lastPatchedVector}
        accountId={effectiveAccountId}
        txHash={lastPayoutTxHash}
        onClose={() => setBreachPopupOpen(false)}
      />
    </div>
  )
}
