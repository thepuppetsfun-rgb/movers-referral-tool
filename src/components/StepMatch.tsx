import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Plus, X } from 'lucide-react'
import type { Mover, MatchedGroup, UnmatchedGroup } from '../types'
import { loadDirectory, matchMovers, getAlternateCenters } from '../lib/matching'

interface Props {
  movers: Mover[]
  onMatched: (matched: MatchedGroup[], unmatched: UnmatchedGroup[]) => void
}

export default function StepMatch({ movers, onMatched }: Props) {
  const [loading, setLoading] = useState(true)
  const [baseMatched, setBaseMatched] = useState<MatchedGroup[]>([])
  const [extraGroups, setExtraGroups] = useState<MatchedGroup[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedGroup[]>([])
  const [expandedAlts, setExpandedAlts] = useState<Set<string>>(new Set())

  const matched = [...baseMatched, ...extraGroups]

  useEffect(() => {
    let cancelled = false
    async function run() {
      await loadDirectory()
      if (cancelled) return
      const result = matchMovers(movers)
      setBaseMatched(result.matched)
      setUnmatched(result.unmatched)
      onMatched(result.matched, result.unmatched)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [movers]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      onMatched(matched, unmatched)
    }
  }, [extraGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAlts(id: string) {
    setExpandedAlts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addAlternate(alt: { id: string; name: string; shliach: string; phone: string; website: string; address: string; city: string; state: string; zip: string; lat: number; lng: number; type: string; url: string; distance: number }, moversForGroup: Mover[]) {
    if (matched.some(g => g.center.id === alt.id)) return
    setExtraGroups(prev => [...prev, {
      center: alt,
      distance: alt.distance,
      movers: moversForGroup,
    }])
  }

  function removeExtra(centerId: string) {
    setExtraGroups(prev => prev.filter(g => g.center.id !== centerId))
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-3 mt-3">Matching...</p>
      </div>
    )
  }

  const totalMatched = baseMatched.reduce((s, g) => s + g.movers.length, 0)
  const extraCenterIds = new Set(extraGroups.map(g => g.center.id))

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="font-display text-xl">{totalMatched} matched</h2>
        <span className="text-sm text-ink-3">to {baseMatched.length} {baseMatched.length === 1 ? 'center' : 'centers'}</span>
      </div>
      {extraGroups.length > 0 && (
        <p className="text-sm text-accent mb-5">+ {extraGroups.length} additional {extraGroups.length === 1 ? 'center' : 'centers'} selected</p>
      )}
      {extraGroups.length === 0 && (
        <p className="text-sm text-ink-3 mb-5">Expand "other nearby" to also send to neighboring shluchim.</p>
      )}

      <div className="space-y-3">
        {baseMatched.map(group => {
          const c = group.center
          const alts = getAlternateCenters(group.movers[0]?.newZip || '')
          const showAlts = expandedAlts.has(c.id) && alts.length > 1
          const isFar = group.distance > 30

          return (
            <div key={c.id} className="border border-border rounded bg-white overflow-hidden">
              <div className="px-3 py-3 sm:px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="font-semibold text-ink">{c.name}</h3>
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-ink-3 hover:text-accent flex items-center gap-0.5 shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {c.shliach && <p className="text-sm text-ink-3 mt-0.5">{c.shliach}</p>}
                    <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-ink-3">
                      <span>{c.city}, {c.state}</span>
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-accent">{group.movers.length}</div>
                    <div className={`text-xs ${isFar ? 'text-amber font-medium' : 'text-ink-3'}`}>
                      {group.distance.toFixed(0)} mi
                    </div>
                  </div>
                </div>

                {alts.length > 1 && (
                  <>
                    <button
                      onClick={() => toggleAlts(c.id)}
                      className="mt-1.5 text-xs text-ink-3 hover:text-ink flex items-center gap-0.5"
                    >
                      {showAlts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {alts.length - 1} other nearby
                    </button>
                    {showAlts && (
                      <div className="mt-1.5 pl-3 border-l-2 border-border space-y-1.5">
                        {alts.filter(a => a.id !== c.id).map(alt => {
                          const isAdded = extraCenterIds.has(alt.id)
                          return (
                            <div key={alt.id} className="flex items-center justify-between gap-2">
                              <div className="text-xs text-ink-3">
                                <a href={alt.url} target="_blank" rel="noopener noreferrer"
                                  className="hover:text-ink underline decoration-border">
                                  {alt.name}
                                </a>
                                <span className="ml-1.5">{alt.distance.toFixed(0)} mi</span>
                              </div>
                              {isAdded ? (
                                <button
                                  onClick={() => removeExtra(alt.id)}
                                  className="shrink-0 text-xs text-accent flex items-center gap-0.5 hover:text-accent-hover"
                                >
                                  <X className="h-3 w-3" /> Added
                                </button>
                              ) : (
                                <button
                                  onClick={() => addAlternate(alt, group.movers)}
                                  className="shrink-0 text-xs text-ink-3 hover:text-accent flex items-center gap-0.5"
                                >
                                  <Plus className="h-3 w-3" /> Also send
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-border/50 bg-surface">
                {group.movers.map((m, i) => (
                  <div key={m.id} className={`px-3 py-2 sm:px-4 flex items-center justify-between text-sm ${
                    i > 0 ? 'border-t border-border/30' : ''
                  }`}>
                    <span className="text-ink-2">{m.firstName} {m.lastName}</span>
                    <span className="text-ink-3 hide-mobile">{m.newZip}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {extraGroups.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-ink-3 mb-2">Also sending to:</h3>
            <div className="space-y-2">
              {extraGroups.map(group => (
                <div key={group.center.id} className="border border-accent/30 rounded bg-accent-bg px-3 py-2.5 sm:px-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink truncate block">{group.center.name}</span>
                    <span className="text-xs text-ink-3">
                      {group.center.shliach && <>{group.center.shliach} &middot; </>}
                      {group.distance.toFixed(0)} mi
                    </span>
                  </div>
                  <button
                    onClick={() => removeExtra(group.center.id)}
                    className="text-xs text-ink-3 hover:text-accent flex items-center gap-0.5"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {unmatched.length > 0 && unmatched.flatMap(g => g.movers).length > 0 && (
          <div className="border border-amber/30 rounded bg-amber-bg p-4">
            <p className="text-xs font-medium text-amber mb-2">Unknown zip codes</p>
            {unmatched.flatMap(g => g.movers).map(m => (
              <div key={m.id} className="text-xs text-ink-3 flex justify-between py-0.5">
                <span>{m.firstName} {m.lastName}</span>
                <a href={`https://www.chabad.org/jewish-centers/location/2-${m.newZip}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-accent hover:underline">{m.newZip}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
