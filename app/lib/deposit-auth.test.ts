import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isVerifiedDeposit, type DepositTxResult } from './deposit-auth.ts'

const ACCOUNT = 'alice.testnet'
const CONTRACT = 'vault.near-bail.testnet'
const MIN_DEPOSIT = '500000000000000000000000'

function depositTx(overrides: DepositTxResult = {}): DepositTxResult {
  return {
    status: { SuccessValue: '' },
    transaction: {
      signer_id: ACCOUNT,
      receiver_id: CONTRACT,
      actions: [
        {
          FunctionCall: {
            method_name: 'deposit_bond',
            deposit: MIN_DEPOSIT,
          },
        },
      ],
    },
    receipts_outcome: [{ outcome: { status: { SuccessValue: '' } } }],
    ...overrides,
  }
}

describe('deposit verification', () => {
  it('accepts a finished deposit_bond with SuccessValue', () => {
    assert.equal(isVerifiedDeposit(ACCOUNT, CONTRACT, depositTx()), true)
  })

  it('rejects SuccessReceiptId when the call never resolved to a value', () => {
    assert.equal(
      isVerifiedDeposit(
        ACCOUNT,
        CONTRACT,
        depositTx({ status: { SuccessReceiptId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } }),
      ),
      false,
    )
  })

  it('rejects a final SuccessValue when any receipt failed', () => {
    assert.equal(
      isVerifiedDeposit(
        ACCOUNT,
        CONTRACT,
        depositTx({
          receipts_outcome: [
            { outcome: { status: { Failure: { ActionError: {} } } } },
          ],
        }),
      ),
      false,
    )
  })

  it('rejects a deposit below the 0.5 NEAR bond', () => {
    assert.equal(
      isVerifiedDeposit(
        ACCOUNT,
        CONTRACT,
        depositTx({
          transaction: {
            signer_id: ACCOUNT,
            receiver_id: CONTRACT,
            actions: [
              {
                FunctionCall: {
                  method_name: 'deposit_bond',
                  deposit: '1',
                },
              },
            ],
          },
        }),
      ),
      false,
    )
  })
})
