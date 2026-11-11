// Procedural Web Audio API synthesizer for near-bail.
// Zero external audio assets required.

let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }
  return sharedAudioCtx
}

export function playClick(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(620, now)
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.045)

  gain.gain.setValueAtTime(0.14, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.05)
}

export function playDodge(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(340, now)
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.07)

  gain.gain.setValueAtTime(0.1, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.08)
}

export function playBuzzer(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gain = ctx.createGain()

  osc1.type = 'sawtooth'
  osc2.type = 'square'

  osc1.frequency.setValueAtTime(115, now)
  osc1.frequency.linearRampToValueAtTime(82, now + 0.36)

  osc2.frequency.setValueAtTime(121, now)
  osc2.frequency.linearRampToValueAtTime(76, now + 0.36)

  gain.gain.setValueAtTime(0.18, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + 0.4)
  osc2.stop(now + 0.4)
}

export function playBurnBail(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  osc.frequency.setValueAtTime(260, now)
  osc.frequency.setValueAtTime(390, now + 0.06)
  osc.frequency.setValueAtTime(520, now + 0.12)

  gain.gain.setValueAtTime(0.12, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.21)
}

export function playStageClear(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const notes = [440, 554.37, 659.25]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = now + idx * 0.065
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, start)

    gain.gain.setValueAtTime(0.14, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.15)
  })
}

export function playTick(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(980, now)
  gain.gain.setValueAtTime(0.07, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.03)
}

export function playVaultRelease(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const chord = [523.25, 659.25, 783.99, 1046.5]
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = now + idx * 0.08
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, start)

    gain.gain.setValueAtTime(0.16, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.36)
  })
}
