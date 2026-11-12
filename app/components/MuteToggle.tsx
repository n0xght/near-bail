import React, { useEffect, useState } from 'react'
import { Mute, Sound } from 'reicon-react'
import {
  initAudioMute,
  isAudioMuted,
  playClick,
  setAudioMuted,
} from '../lib/sound'

export const MuteToggle: React.FC = () => {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMuted(initAudioMute())
  }, [])

  const toggle = () => {
    const next = setAudioMuted(!isAudioMuted())
    setMuted(next)
    if (!next) playClick()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'unmute audio' : 'mute audio'}
      title={muted ? 'unmute audio' : 'mute audio'}
      className="flex h-7 w-7 items-center justify-center border-2 border-[#111] bg-white text-[#111] shadow-[2px_2px_0px_#111] transition-opacity duration-150 hover:opacity-70"
    >
      {muted ? <Mute size={15} /> : <Sound size={15} />}
    </button>
  )
}