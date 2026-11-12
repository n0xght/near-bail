export const NEAR_NETWORK = 'testnet'
export const DEFAULT_CONTRACT_ID =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_CONTRACT_ID) ||
  'vault.near-bail.testnet'
export const NEAR_RPC_URL = 'https://rpc.testnet.near.org'

export interface VaultState {
  prize_pool: string
  total_bails_paid: number
  player_bond_balance: string
  player_unlocked_stage?: number
  patched_excuses: string[]
  warden_account: string
}

/**
 * Queries get_vault_state directly from NEAR Testnet RPC.
 * The demo branch has no wallet or signing code.
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