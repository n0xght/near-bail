import type { WalletSelector } from '@near-wallet-selector/core'

export const NEAR_NETWORK = 'testnet'
export const DEFAULT_CONTRACT_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_CONTRACT_ID) ||
  'vault.near-bail.testnet'
export const NEAR_RPC_URL = 'https://rpc.testnet.near.org'

export const HALF_NEAR_YOCTO = '500000000000000000000000' // 0.5 NEAR
export const TENTH_NEAR_YOCTO = '100000000000000000000000' // 0.1 NEAR

export interface VaultState {
  prize_pool: string
  total_bails_paid: number
  player_bond_balance: string
  player_unlocked_stage?: number
  patched_excuses: string[]
  warden_account: string
}

let selectorPromise: Promise<WalletSelector | null> | null = null

/**
 * Initializes @near-wallet-selector/core strictly on the client side.
 * Must be invoked inside a browser useEffect or event handler so Cloudflare Worker SSR
 * never touches window or localStorage.
 */
export async function getClientWalletSelector(): Promise<WalletSelector | null> {
  if (typeof window === 'undefined') {
    return null
  }

  if (!selectorPromise) {
    selectorPromise = (async () => {
      const [{ setupWalletSelector }, { setupMyNearWallet }] = await Promise.all([
        import('@near-wallet-selector/core'),
        import('@near-wallet-selector/my-near-wallet'),
      ])

      return setupWalletSelector({
        network: NEAR_NETWORK,
        modules: [
          setupMyNearWallet({
            walletUrl: 'https://testnet.mynearwallet.com',
          }),
        ],
      })
    })()
  }

  return selectorPromise
}

export async function getConnectedAccountId(): Promise<string | null> {
  try {
    const selector = await getClientWalletSelector()
    if (!selector) return null
    const state = selector.store.getState()
    const active =
      state.accounts.find((acc) => acc.active) ?? state.accounts[0]
    return active?.accountId ?? null
  } catch {
    return null
  }
}

export async function connectNearWallet(
  contractId: string = DEFAULT_CONTRACT_ID,
): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const selector = await getClientWalletSelector()
  if (!selector) return null

  const existing = await getConnectedAccountId()
  if (existing) return existing

  const wallet = await selector.wallet('my-near-wallet')
  await (
    wallet as unknown as {
      signIn: (params: {
        contractId: string
        methodNames?: string[]
      }) => Promise<void>
    }
  ).signIn({
    contractId,
    methodNames: ['deposit_bond', 'use_bail'],
  })

  return getConnectedAccountId()
}

export async function disconnectNearWallet(): Promise<void> {
  if (typeof window === 'undefined') return
  const selector = await getClientWalletSelector()
  if (!selector) return
  if (!selector.isSignedIn()) return

  const wallet = await selector.wallet()
  await wallet.signOut()
}

/**
 * Calls deposit_bond on the vault contract with 0.5 NEAR attached deposit.
 */
export async function depositBailBondOnChain(
  contractId: string = DEFAULT_CONTRACT_ID,
): Promise<{ txHash: string | null; simulated: boolean }> {
  if (typeof window === 'undefined') {
    throw new Error('deposit_bond can only be initiated from the browser')
  }

  const selector = await getClientWalletSelector()
  if (selector && selector.isSignedIn()) {
    const wallet = await selector.wallet()
    const outcome = await wallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'deposit_bond',
            args: {},
            gas: '30000000000000',
            deposit: HALF_NEAR_YOCTO,
          },
        },
      ],
    })

    const txHash =
      outcome && typeof outcome === 'object' && 'transaction' in outcome
        ? (outcome as { transaction?: { hash?: string } }).transaction?.hash ?? null
        : null

    return { txHash, simulated: false }
  }

  return { txHash: null, simulated: true }
}

/**
 * Queries get_vault_state directly from NEAR Testnet RPC.
 */
export async function fetchVaultStateFromRpc(
  playerAccountId?: string | null,
  contractId: string = DEFAULT_CONTRACT_ID,
): Promise<VaultState | null> {
  try {
    const argsJson = JSON.stringify({
      player: playerAccountId || null,
    })
    const argsBase64 =
      typeof window !== 'undefined' && typeof window.btoa === 'function'
        ? window.btoa(argsJson)
        : Buffer.from(argsJson, 'utf-8').toString('base64')

    const response = await fetch(NEAR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'near-bail-view',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'optimistic',
          account_id: contractId,
          method_name: 'get_vault_state',
          args_base64: argsBase64,
        },
      }),
    })

    if (!response.ok) return null
    const payload = (await response.json()) as {
      result?: { result?: number[] }
      error?: unknown
    }

    if (!payload.result?.result) return null
    const bytes = new Uint8Array(payload.result.result)
    const decoded = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(decoded) as VaultState
    return parsed
  } catch {
    return null
  }
}

/**
 * Converts a yoctoNEAR string into a clean decimal NEAR string (e.g. "2.4" or "0.5").
 */
export function yoctoToNearString(yocto: string | bigint): string {
  try {
    const raw = typeof yocto === 'bigint' ? yocto : BigInt(yocto || '0')
    const base = 10n ** 24n
    const whole = raw / base
    const fraction = (raw % base) / 10n ** 20n // 4 decimal places max
    if (fraction === 0n) {
      return `${whole.toString()}.0`
    }
    const fracStr = fraction.toString().padStart(4, '0').replace(/0+$/, '')
    return `${whole.toString()}.${fracStr}`
  } catch {
    return '0.0'
  }
}

export function nearToYoctoString(nearAmount: number): string {
  const tenths = Math.round(nearAmount * 10000)
  const yocto = BigInt(tenths) * 10n ** 20n
  return yocto.toString()
}
