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

const YOCTO_PER_NEAR = 10n ** 24n
const BAIL_COST_YOCTO = 100_000_000_000_000_000_000_000n
const STALE_SNAPSHOT_BUMP_YOCTO = 500_000_000_000_000_000_000_000n

/**
 * Converts a yoctoNEAR amount into a decimal NEAR string without rounding.
 * Trailing zeros in the fraction are trimmed. Whole amounts stay `n.0`.
 */
export function yoctoToNearString(yocto: string | bigint): string {
  try {
    const raw = typeof yocto === 'bigint' ? yocto : BigInt(yocto || '0')
    if (raw < 0n) return '0.0'
    const whole = raw / YOCTO_PER_NEAR
    const fraction = raw % YOCTO_PER_NEAR
    if (fraction === 0n) return `${whole.toString()}.0`
    const fracStr = fraction.toString().padStart(24, '0').replace(/0+$/, '')
    return `${whole.toString()}.${fracStr}`
  } catch {
    return '0.0'
  }
}

/**
 * Parses a decimal NEAR string into yoctoNEAR.
 * Returns null when the text is not a non-negative decimal with at most 24 places.
 */
export function nearToYocto(value: string): bigint | null {
  const cleaned = value.trim()
  if (!/^\d*(\.\d*)?$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null
  }

  const [whole = '0', fraction = ''] = cleaned.split('.')
  if (fraction.length > 24) return null

  const paddedFraction = (fraction + '0'.repeat(24)).slice(0, 24)
  return BigInt(whole || '0') * YOCTO_PER_NEAR + BigInt(paddedFraction || '0')
}

export function nearToYoctoString(nearAmount: string | number): string {
  const yocto = nearToYocto(String(nearAmount))
  return yocto === null ? '0' : yocto.toString()
}

export function addNearStrings(current: string, delta: string): string {
  return yoctoToNearString((nearToYocto(current) ?? 0n) + (nearToYocto(delta) ?? 0n))
}

export function subNearStrings(current: string, delta: string): string {
  const left = nearToYocto(current) ?? 0n
  const right = nearToYocto(delta) ?? 0n
  return yoctoToNearString(left > right ? left - right : 0n)
}

export function hasEnoughForBail(nearAmount: string): boolean {
  const yocto = nearToYocto(nearAmount)
  return yocto !== null && yocto >= BAIL_COST_YOCTO
}

export function bailRetries(nearAmount: string): number {
  const yocto = nearToYocto(nearAmount)
  if (yocto === null || yocto < BAIL_COST_YOCTO) return 0
  const retries = yocto / BAIL_COST_YOCTO
  const max = BigInt(Number.MAX_SAFE_INTEGER)
  return Number(retries > max ? max : retries)
}

/** Half of the pool, using the same integer division as release_vault. */
export function formatHalfPoolNear(vaultPoolNear: string): string {
  const cleaned = vaultPoolNear
    .trim()
    .toLowerCase()
    .replace(/near/g, '')
    .replace(/,/g, '')
    .trim()
  const yocto = nearToYocto(cleaned)
  if (yocto === null || yocto <= 0n) return '0.0'
  return yoctoToNearString(yocto / 2n)
}

export function sanitizeNearAmount(raw: string): string {
  const trimmed = raw.trim().slice(0, 32)
  return /^\d+(\.\d+)?$/.test(trimmed) ? trimmed : '0'
}

/**
 * Stage 6's stale snapshot is the canonical pool plus the 0.5 NEAR bait.
 * Integer yocto avoids `parseFloat(...) + 0.5` collapsing the two values.
 */
export function staleSnapshotYocto(canonicalYocto: string): string {
  try {
    const canonical = BigInt(canonicalYocto)
    if (canonical < 0n) return STALE_SNAPSHOT_BUMP_YOCTO.toString()
    return (canonical + STALE_SNAPSHOT_BUMP_YOCTO).toString()
  } catch {
    return STALE_SNAPSHOT_BUMP_YOCTO.toString()
  }
}

/**
 * True when the guess is exactly the integer half of the canonical yocto pool.
 * A parsed zero is a real answer, not a missing one.
 */
export function isCorrectPayoutGuess(rawGuess: string, vaultYocto: string): boolean {
  const cleaned = rawGuess
    .trim()
    .toLowerCase()
    .replace(/near/g, '')
    .replace(/,/g, '')
    .trim()
  const guessYocto = nearToYocto(cleaned)
  if (guessYocto === null) return false
  let pool: bigint
  try {
    pool = BigInt(vaultYocto)
  } catch {
    return false
  }
  if (pool < 0n) return false
  return guessYocto === pool / 2n
}