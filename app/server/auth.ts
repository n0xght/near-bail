import { createServerFn } from '@tanstack/react-start'
import {
  issueSessionToken,
  verifyDepositTransaction,
  verifySessionToken,
  type DepositAuthConfig,
  type SessionPayload,
} from '../lib/deposit-auth'

const authConfig: DepositAuthConfig = {
  contractId:
    process.env.CONTRACT_ID ||
    process.env.VITE_CONTRACT_ID ||
    'vault.near-bail.testnet',
  rpcUrl: 'https://rpc.testnet.near.org',
  secret: process.env.AUTH_SECRET || '',
  ttlMs: 60 * 60 * 1000,
}

export interface VerifyDepositAuthInput {
  accountId: string
  txHash: string
}

export interface VerifyDepositAuthResult {
  ok: boolean
  accountId: string | null
  token: string | null
  expiresAt: number | null
  error: string | null
}

export async function requireSession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!authConfig.secret) return null
  return verifySessionToken(token, authConfig.secret)
}

export const verifyDepositAuthFn = createServerFn({ method: 'POST' })
  .validator((data: VerifyDepositAuthInput) => data)
  .handler(async ({ data }): Promise<VerifyDepositAuthResult> => {
    const accountId = (data.accountId || '').trim().toLowerCase()
    const txHash = (data.txHash || '').trim()

    if (!authConfig.secret) {
      return {
        ok: false,
        accountId: null,
        token: null,
        expiresAt: null,
        error: 'auth secret is not configured',
      }
    }

    const valid = await verifyDepositTransaction(accountId, txHash, authConfig)
    if (!valid) {
      return {
        ok: false,
        accountId: null,
        token: null,
        expiresAt: null,
        error: 'deposit_bond transaction could not be verified',
      }
    }

    const session = await issueSessionToken(accountId, txHash, authConfig)
    return {
      ok: true,
      accountId,
      token: session.token,
      expiresAt: session.expiresAt,
      error: null,
    }
  })