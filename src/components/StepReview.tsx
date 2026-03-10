import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Mover } from '../types'

interface Props {
  movers: Mover[]
  onUpdate: (movers: Mover[]) => void
}

export default function StepReview({ movers, onUpdate }: Props) {
  const [search, setSearch] = useState('')

  const activeCount = movers.filter(m => !m.excluded).length
  const filtered = movers.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.newCity.toLowerCase().includes(q) ||
      m.newState.toLowerCase().includes(q) ||
      m.newZip.includes(q)
    )
  })

  function toggleExclude(id: string) {
    onUpdate(movers.map(m => m.id === id ? { ...m, excluded: !m.excluded } : m))
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display text-xl">
          {activeCount} <span className="text-ink-3 text-base font-normal font-sans">of {movers.length} selected</span>
        </h2>
        <div className="flex gap-3 text-xs text-ink-3">
          <button onClick={() => onUpdate(movers.map(m => ({ ...m, excluded: false })))} className="hover:text-accent">All</button>
          <button onClick={() => onUpdate(movers.map(m => ({ ...m, excluded: true })))} className="hover:text-accent">None</button>
        </div>
      </div>
      <p className="text-sm text-ink-3 mb-4">Uncheck anyone you don't want to include in the referrals.</p>

      {movers.length > 20 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder="Search by name, city, or zip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded py-2 pl-9 pr-3 text-sm placeholder:text-ink-3/50 focus:outline-none focus:border-ink-3"
          />
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto custom-scroll border border-border rounded bg-white">
        {filtered.map((m, i) => (
          <label
            key={m.id}
            className={`flex items-center gap-3 px-3 py-3 sm:py-2.5 cursor-pointer transition-colors ${
              i > 0 ? 'border-t border-border/50' : ''
            } ${m.excluded ? 'opacity-30' : 'hover:bg-surface-2'}`}
          >
            <input
              type="checkbox"
              checked={!m.excluded}
              onChange={() => toggleExclude(m.id)}
              className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-ink truncate block">{m.firstName} {m.lastName}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm text-ink-2">{[m.newCity, m.newState].filter(Boolean).join(', ')}</div>
              <div className="text-xs text-ink-3">{m.newZip}</div>
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-ink-3">
            {search ? 'No results.' : 'No movers found.'}
          </div>
        )}
      </div>
    </div>
  )
}
