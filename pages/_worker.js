export default {
  async fetch(request, env) {
    if (!env.NEAR_BAIL) {
      return new Response('near-bail worker binding is missing', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    const response = await env.NEAR_BAIL.fetch(request)
    const headers = new Headers(response.headers)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    )
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}