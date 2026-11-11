const RPC_URL = 'https://rpc.testnet.near.org'
const CONTRACT_ID = process.env.VITE_CONTRACT_ID || 'vault.near-bail.testnet'
const args = Buffer.from(JSON.stringify({ player: null }), 'utf-8').toString(
  'base64',
)

const response = await fetch(RPC_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 'near-bail-verify',
    method: 'query',
    params: {
      request_type: 'call_function',
      finality: 'final',
      account_id: CONTRACT_ID,
      method_name: 'get_vault_state',
      args_base64: args,
    },
  }),
})

const payload = await response.json()

if (payload.error) {
  console.error(
    `contract check failed for ${CONTRACT_ID}:`,
    payload.error.cause?.name || payload.error.message,
  )
  process.exit(1)
}

const decoded = JSON.parse(
  Buffer.from(payload.result.result, 'base64').toString('utf-8'),
)

console.log(`contract: ${CONTRACT_ID}`)
console.log(JSON.stringify(decoded, null, 2))