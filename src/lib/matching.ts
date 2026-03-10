import type { ChabadCenter, Mover, MatchedGroup, UnmatchedGroup } from '../types'
import { haversine } from './haversine'

const REFERRAL_TYPES = new Set([
  'Chabad House', 'Campus Chabad House', 'Synagogue', 'Jewish Community Center',
  'Young Professionals', 'Russian Jewry Center', 'Israeli Center', '',
])

let directory: ChabadCenter[] = []
let zipCentroids: Record<string, [number, number]> = {}

export async function loadDirectory() {
  if (directory.length === 0) {
    const mod = await import('../data/directory.json')
    directory = (mod.default as ChabadCenter[]).filter(c => REFERRAL_TYPES.has(c.type))
  }
  if (Object.keys(zipCentroids).length === 0) {
    const mod = await import('../data/zip-centroids.json')
    zipCentroids = mod.default as unknown as Record<string, [number, number]>
  }
}

export function findNearestCenters(zip: string, maxResults = 5): (ChabadCenter & { distance: number })[] {
  const centroid = zipCentroids[zip]
  if (!centroid) return []

  const [lat, lng] = centroid

  const withDist = directory.map(c => ({
    ...c,
    distance: haversine(lat, lng, c.lat, c.lng),
  }))

  return withDist
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
}

export function matchMovers(movers: Mover[]): {
  matched: MatchedGroup[]
  unmatched: UnmatchedGroup[]
} {
  const active = movers.filter(m => !m.excluded)

  const byZip = new Map<string, Mover[]>()
  for (const m of active) {
    const zip = m.newZip
    if (!byZip.has(zip)) byZip.set(zip, [])
    byZip.get(zip)!.push(m)
  }

  const centerGroups = new Map<string, { center: ChabadCenter; distance: number; movers: Mover[] }>()
  const unmatched: UnmatchedGroup[] = []

  for (const [zip, zipMovers] of byZip) {
    const nearest = findNearestCenters(zip, 3)

    if (nearest.length === 0) {
      unmatched.push({ zip, movers: zipMovers })
      continue
    }

    const top = nearest[0]
    const key = top.id

    if (!centerGroups.has(key)) {
      centerGroups.set(key, { center: top, distance: top.distance, movers: [] })
    }
    centerGroups.get(key)!.movers.push(...zipMovers)
  }

  const matched = Array.from(centerGroups.values()).sort((a, b) => {
    return b.movers.length - a.movers.length
  })

  return { matched, unmatched }
}

export function getAlternateCenters(zip: string): (ChabadCenter & { distance: number })[] {
  return findNearestCenters(zip, 5)
}
