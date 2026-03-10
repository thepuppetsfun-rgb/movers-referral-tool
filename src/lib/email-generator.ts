import type { MatchedGroup, SenderInfo, Mover } from '../types'

export function getDefaultTemplate(sender: SenderInfo): string {
  const sig = [sender.name, sender.chabadHouse, sender.phone, sender.email].filter(Boolean).join('\n')

  return `Hi,

I ran NCOA and these families from our list recently moved to your area:

{movers}

Happy to share any other info I have on them.

Hatzlacha raba!${sig ? '\n' + sig : ''}`
}

export function generateEmailBody(group: MatchedGroup, template: string): string {
  const moverLines = group.movers.map(m => formatMoverLine(m)).join('\n')
  return template.replace('{movers}', moverLines)
}

function formatMoverLine(m: Mover): string {
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown'
  const parts = [m.newAddress, m.newCity, m.newState, m.newZip].filter(Boolean)
  const addr = parts.length > 0 ? parts.join(', ') : `ZIP ${m.newZip}`
  return `  - ${name} - ${addr}`
}

export function generateMailtoUrl(draft: { to: string; subject: string; body: string }): string {
  const subject = encodeURIComponent(draft.subject)
  const body = encodeURIComponent(draft.body)
  const mailto = `mailto:${encodeURIComponent(draft.to)}?subject=${subject}&body=${body}`

  if (mailto.length > 2000) {
    return `mailto:${encodeURIComponent(draft.to)}?subject=${subject}`
  }
  return mailto
}

export function generateSubject(group: MatchedGroup): string {
  const familyWord = group.movers.length === 1 ? 'family' : 'families'
  return `${group.movers.length} ${familyWord} moved to your area`
}
