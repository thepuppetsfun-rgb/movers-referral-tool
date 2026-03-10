import { useState } from 'react'
import FileDropzone from './FileDropzone'
import ColumnMapper from './ColumnMapper'
import { parseNcoaCsv, reparseWithMapping, type ParseResult } from '../lib/csv-parse'
import type { ColumnMapping } from '../types'

const PROVIDER_LABELS: Record<string, string> = {
  truencoa: 'TrueNCOA',
  ncoasource: 'NCOASource',
  salesforce: 'Salesforce',
  chabadcms: 'ChabadCMS',
  generic: 'CSV',
}

interface Props {
  onParsed: (result: ParseResult) => void
  onContinue: () => void
}

export default function StepUpload({ onParsed, onContinue }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [showMapper, setShowMapper] = useState(false)

  async function handleFile(file: File) {
    setLoading(true)
    setShowMapper(false)
    const r = await parseNcoaCsv(file)
    setResult(r)
    setLoading(false)
    if (r.errors.length === 0) {
      onParsed(r)
    } else if (r.headers.length > 0) {
      setShowMapper(true)
    }
  }

  function handleManualMapping(mapping: ColumnMapping) {
    if (!result) return
    const reparsed = reparseWithMapping(result.rawRows, mapping, result.provider, result.headers)
    setResult(reparsed)
    setShowMapper(false)
    onParsed(reparsed)
  }

  return (
    <div>
      <FileDropzone onFile={handleFile} loading={loading} />

      {result && result.errors.length === 0 && !showMapper && (
        <div className="mt-4 bg-green-bg border border-green/20 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-green">{result.movers.length}</span>
              <span className="text-sm text-ink-2">movers found</span>
              <span className="text-xs text-ink-3">{result.totalRows.toLocaleString()} records &middot; {PROVIDER_LABELS[result.provider]}</span>
            </div>
            <button
              onClick={onContinue}
              className="bg-accent text-white px-5 py-2 text-sm font-medium rounded hover:bg-accent-hover flex items-center gap-1.5"
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      )}

      {showMapper && result && (
        <ColumnMapper
          headers={result.headers}
          initialMapping={result.mapping}
          sampleRows={result.rawRows}
          onConfirm={handleManualMapping}
        />
      )}

      {result && result.errors.length > 0 && !showMapper && (
        <div className="mt-4 bg-amber-bg border border-amber/20 rounded p-4">
          <p className="text-sm font-medium text-amber">Couldn't read this file</p>
          {result.errors.map((err, i) => (
            <p key={i} className="text-sm text-ink-3 mt-1">{err}</p>
          ))}
        </div>
      )}
    </div>
  )
}
