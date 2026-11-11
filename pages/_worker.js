export default {
  async fetch(request, env) {
    return env.NEAR_BAIL.fetch(request)
  },
}
