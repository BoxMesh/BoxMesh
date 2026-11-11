import discord from '../assets/channels/discord.svg'
import email from '../assets/channels/email.svg'
import telegram from '../assets/channels/telegram.svg'
import type { ChannelKind } from '../types/alert'
import { KIND_LABEL } from '../utils/alerts'

const SRC: Record<ChannelKind, string> = { telegram, discord, email }

/** Brand mark for a channel type. Pass `named` where the type isn't written next to it, so it is read out. */
export default function ChannelIcon({ kind, size = 16, named = false }: { kind: ChannelKind; size?: number; named?: boolean }) {
  return (
    <img
      className="channel-icon"
      src={SRC[kind]}
      width={size}
      height={size}
      alt={named ? KIND_LABEL[kind] : ''}
      aria-hidden={named ? undefined : true}
    />
  )
}
