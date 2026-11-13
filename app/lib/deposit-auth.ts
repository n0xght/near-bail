const MIN_BOND_YOCTO = 500000000000000000000000n
const ACCOUNT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/
const TX_HASH_PATTERN = /^[A-Za-z0-9]{32,64}$/

export interface DepositAuthConfig {
  contractId: string
  rpcUrl: string
  secret: string
  ttlMs?: number
}

export interface SessionPayload {
  sub: string
  tx: string
  exp: number
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function issueSessionToken(
  accountId: string,
  txHash: string,
  config: DepositAuthConfig,
): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + (config.ttlMs ?? 60 * 60 * 1000)
  const payload: SessionPayload = { sub: accountId, tx: txHash, exp: expiresAt }
  const encoded = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(config.secret),
    new TextEncoder().encode(encoded),
  )
  return {
    token: `${encoded}.${base64UrlEncode(new Uint8Array(signature))}`,
    expiresAt,
  }
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      base64UrlDecode(signature) as unknown as BufferSource,
      new TextEncoder().encode(encoded),
    )
    if (!valid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encoded)),
    ) as SessionPayload
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null
    if (!ACCOUNT_ID_PATTERN.test(payload.sub)) return null
    return payload
  } catch {
    return null
  }
}

export interface DepositReceiptStatus {
  SuccessValue?: string
  SuccessReceiptId?: string
  Failure?: unknown
}

export interface DepositTxResult {
  status?: DepositReceiptStatus
  transaction?: {
    signer_id?: string
    receiver_id?: string
    actions?: Array<{
      FunctionCall?: { method_name?: string; deposit?: string }
    }>
  }
  receipts_outcome?: Array<{
    outcome?: { status?: DepositReceiptStatus }
  }>
}

/**
 * A deposit counts only when the final status is SuccessValue and no receipt
 * failed. SuccessReceiptId by itself means the chain stopped on a receipt id.
 */
export function isVerifiedDeposit(
  accountId: string,
  contractId: string,
  result: DepositTxResult,
): boolean {
  const transaction = result.transaction
  const status = result.status
  if (!transaction || !status) return false
  if (transaction.signer_id !== accountId) return false
  if (transaction.receiver_id !== contractId) return false
  if (!('SuccessValue' in status) || 'Failure' in status) return false
  if (
    (result.receipts_outcome ?? []).some(
      (receipt) =>
        receipt.outcome?.status && 'Failure' in receipt.outcome.status,
    )
  ) {
    return false
  }

  const call = (transaction.actions ?? []).find(
    (action) => action.FunctionCall?.method_name === 'deposit_bond',
  )
  if (!call?.FunctionCall?.deposit) return false
  try {
    return BigInt(call.FunctionCall.deposit) >= MIN_BOND_YOCTO
  } catch {
    return false
  }
}

export async function verifyDepositTransaction(
  accountId: string,
  txHash: string,
  config: DepositAuthConfig,
): Promise<boolean> {
  if (!ACCOUNT_ID_PATTERN.test(accountId)) return false
  if (!TX_HASH_PATTERN.test(txHash)) return false

  try {
    const response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'near-bail-deposit-auth',
        method: 'tx',
        params: {
          tx_hash: txHash,
          sender_account_id: accountId,
          wait_until: 'FINAL',
        },
      }),
    })
    if (!response.ok) return false

    const payload = (await response.json()) as {
      result?: DepositTxResult
      error?: unknown
    }
    if (payload.error || !payload.result) return false

    return isVerifiedDeposit(accountId, config.contractId, payload.result)
  } catch {
    return false
  }
}