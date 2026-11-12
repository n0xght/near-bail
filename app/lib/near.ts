import { NearConnector } from '@hot-labs/near-connect'

export const NEAR_NETWORK = 'testnet'
export const DEFAULT_CONTRACT_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_CONTRACT_ID) ||
  'vault.near-bail.testnet'
export const NEAR_RPC_URL = 'https://rpc.testnet.near.org'

export const HALF_NEAR_YOCTO = '500000000000000000000000' // 0.5 NEAR

export interface VaultState {
  prize_pool: string
  total_bails_paid: number
  player_bond_balance: string
  player_unlocked_stage?: number
  patched_excuses: string[]
  warden_account: string
}

let connector: NearConnector | null = null

/**
 * NEAR Connect is browser-only. Initialize lazily so Cloudflare SSR never
 * touches window or storage.
 */
export function getNearConnector(): NearConnector | null {
  if (typeof window === 'undefined') return null
  if (!connector) {
    connector = new NearConnector({
      network: NEAR_NETWORK,
      features: {
        signAndSendTransaction: true,
        signInWithoutAddKey: true,
      },
    })
  }
  return connector
}

export async function getConnectedAccountId(): Promise<string | null> {
  const nearConnector = getNearConnector()
  if (!nearConnector) return null
  try {
    const connected = await nearConnector.getConnectedWallet()
    return connected.accounts[0]?.accountId ?? null
  } catch {
    return null
  }
}

export async function connectNearWallet(): Promise<string | null> {
  const nearConnector = getNearConnector()
  if (!nearConnector) return null

  const wallet = await nearConnector.connect()
  const accounts = await wallet.getAccounts()
  return accounts[0]?.accountId ?? null
}

export async function disconnectNearWallet(): Promise<void> {
  const nearConnector = getNearConnector()
  if (!nearConnector) return
  try {
    const connected = await nearConnector.getConnectedWallet()
    await nearConnector.disconnect(connected.wallet)
  } catch {
    // no connected wallet
  }
}

/**
 * Calls deposit_bond on the vault contract with 0.5 NEAR attached deposit.
 */
export async function depositBailBondOnChain(
  contractId: string = DEFAULT_CONTRACT_ID,
): Promise<{ txHash: string | null }> {
  if (typeof window === 'undefined') {
    throw new Error('deposit_bond can only be initiated from the browser')
  }

  const nearConnector = getNearConnector()
  if (!nearConnector) throw new Error('NEAR Connect is not available')
  if (!(await getConnectedAccountId())) {
    throw new Error('connect a wallet before posting a bond')
  }

  const wallet = await nearConnector.wallet()
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

  let txHash: string | null = null
  if (outcome && typeof outcome === 'object') {
    if (
      'transaction' in outcome &&
      outcome.transaction &&
      typeof outcome.transaction === 'object' &&
      'hash' in outcome.transaction &&
      typeof outcome.transaction.hash === 'string'
    ) {
      txHash = outcome.transaction.hash
    } else if (
      'transaction_outcome' in outcome &&
      outcome.transaction_outcome &&
      typeof outcome.transaction_outcome === 'object' &&
      'id' in outcome.transaction_outcome &&
      typeof outcome.transaction_outcome.id === 'string'
    ) {
      txHash = outcome.transaction_outcome.id
    }
  }

  return { txHash }
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
    return JSON.parse(decoded) as VaultState
  } catch {
    return null
  }
}

/**
 * Converts a yoctoNEAR string into a clean decimal NEAR string.
 */
export function yoctoToNearString(yocto: string | bigint): string {
  try {
    const raw = typeof yocto === 'bigint' ? yocto : BigInt(yocto || '0')
    const base = 10n ** 24n
    const whole = raw / base
    const fraction = (raw % base) / 10n ** 20n
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
  return (BigInt(tenths) * 10n ** 20n).toString()
}