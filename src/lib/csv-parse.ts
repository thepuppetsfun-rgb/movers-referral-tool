import Papa from 'papaparse'
import type { Mover, ColumnMapping, CsvProvider } from '../types'
import { detectProvider, mapColumns, validateMapping } from './csv-detect'

export interface ParseResult {
  movers: Mover[]
  totalRows: number
  provider: CsvProvider
  mapping: ColumnMapping
  errors: string[]
  headers: string[]
  rawRows: Record<string, string>[]
}

export function parseNcoaCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || []
        const rows = results.data as Record<string, string>[]
        const provider = detectProvider(headers)
        const mapping = mapColumns(headers, provider)
        const validationErrors = validateMapping(mapping)

        if (validationErrors.length > 0) {
          resolve({
            movers: [],
            totalRows: rows.length,
            provider,
            mapping,
            errors: validationErrors,
            headers,
            rawRows: rows,
          })
          return
        }

        const movers = extractMovers(rows, mapping, provider)

        resolve({
          movers,
          totalRows: rows.length,
          provider,
          mapping,
          errors: [],
          headers,
          rawRows: rows,
        })
      },
    })
  })
}

function extractMovers(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  provider: CsvProvider
): Mover[] {
  if (provider === 'truencoa') {
    return extractTrueNcoaMovers(rows, mapping)
  }

  if (provider === 'ncoasource') {
    return rows
      .filter(row => {
        const flag = getVal(row, 'new_address_flag', Object.keys(row))
        return flag?.toUpperCase() === 'Y'
      })
      .map((row, i) => rowToMover(row, mapping, i))
      .filter(m => m.newZip && m.newZip !== m.oldZip)
  }

  return rows
    .map((row, i) => rowToMover(row, mapping, i))
    .filter(m => m.newZip && m.oldZip && m.newZip !== m.oldZip)
}

function extractTrueNcoaMovers(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Mover[] {
  const rtCol = mapping.recordType
  const idCol = mapping.inputId

  if (!rtCol || !idCol) {
    return rows
      .map((row, i) => rowToMover(row, mapping, i))
      .filter(m => m.newZip && m.oldZip && m.newZip !== m.oldZip)
  }

  const groups = new Map<string, { H?: Record<string, string>; C?: Record<string, string> }>()

  for (const row of rows) {
    const id = row[idCol]
    const rt = row[rtCol]?.toUpperCase()
    if (!id) continue
    if (!groups.has(id)) groups.set(id, {})
    const g = groups.get(id)!
    if (rt === 'H') g.H = row
    else if (rt === 'C') g.C = row
  }

  const movers: Mover[] = []
  let idx = 0

  for (const [, group] of groups) {
    if (!group.H || !group.C) continue

    const oldZip = clean(group.H[mapping.oldZip || ''] || group.H[mapping.newZip || ''])
    const newZip = clean(group.C[mapping.newZip || ''] || group.C[mapping.oldZip || ''])

    if (!oldZip || !newZip || oldZip === newZip) continue

    movers.push({
      id: `mover-${idx++}`,
      firstName: group.H[mapping.firstName || ''] || group.C[mapping.firstName || ''] || '',
      lastName: group.H[mapping.lastName || ''] || group.C[mapping.lastName || ''] || '',
      oldAddress: group.H[mapping.oldAddress || ''] || '',
      oldCity: group.H[mapping.oldCity || ''] || '',
      oldState: group.H[mapping.oldState || ''] || '',
      oldZip,
      newAddress: group.C[mapping.newAddress || ''] || group.C[mapping.oldAddress || ''] || '',
      newCity: group.C[mapping.newCity || ''] || group.C[mapping.oldCity || ''] || '',
      newState: group.C[mapping.newState || ''] || group.C[mapping.oldState || ''] || '',
      newZip,
      moveType: group.C[mapping.moveType || ''] || '',
    })
  }

  return movers
}

function rowToMover(row: Record<string, string>, mapping: ColumnMapping, idx: number): Mover {
  return {
    id: `mover-${idx}`,
    firstName: (mapping.firstName ? row[mapping.firstName] : '') || '',
    lastName: (mapping.lastName ? row[mapping.lastName] : '') || '',
    oldAddress: (mapping.oldAddress ? row[mapping.oldAddress] : '') || '',
    oldCity: (mapping.oldCity ? row[mapping.oldCity] : '') || '',
    oldState: (mapping.oldState ? row[mapping.oldState] : '') || '',
    oldZip: clean(mapping.oldZip ? row[mapping.oldZip] : ''),
    newAddress: (mapping.newAddress ? row[mapping.newAddress] : '') || '',
    newCity: (mapping.newCity ? row[mapping.newCity] : '') || '',
    newState: (mapping.newState ? row[mapping.newState] : '') || '',
    newZip: clean(mapping.newZip ? row[mapping.newZip] : ''),
    moveType: (mapping.moveType ? row[mapping.moveType] : '') || '',
  }
}

function clean(zip: string): string {
  return (zip || '').trim().replace(/\D/g, '').substring(0, 5)
}

function getVal(row: Record<string, string>, pattern: string, keys: string[]): string | undefined {
  const key = keys.find(k => k.toLowerCase().replace(/[\s_-]+/g, '_').includes(pattern))
  return key ? row[key] : undefined
}

export function reparseWithMapping(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  provider: CsvProvider,
  headers: string[]
): ParseResult {
  const movers = extractMovers(rawRows, mapping, provider)
  return {
    movers,
    totalRows: rawRows.length,
    provider,
    mapping,
    errors: [],
    headers,
    rawRows,
  }
}
