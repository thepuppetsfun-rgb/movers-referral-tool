import { useState, useMemo } from 'react'
import type { ColumnMapping } from '../types'

interface Field {
  key: keyof ColumnMapping
  label: string
  required: boolean
  group: 'name' | 'old' | 'new'
}

const FIELDS: Field[] = [
  { key: 'firstName', label: 'First name', required: false, group: 'name' },
  { key: 'lastName', label: 'Last name', required: false, group: 'name' },
  { key: 'oldAddress', label: 'Old address', required: false, group: 'old' },
  { key: 'oldCity', label: 'Old city', required: false, group: 'old' },
  { key: 'oldState', label: 'Old state', required: false, group: 'old' },
  { key: 'oldZip', label: 'Old zip', required: true, group: 'old' },
  { key: 'newAddress', label: 'New address', required: false, group: 'new' },
  { key: 'newCity', label: 'New city', required: false, group: 'new' },
  { key: 'newState', label: 'New state', required: false, group: 'new' },
  { key: 'newZip', label: 'New zip', required: true, group: 'new' },
]

const GROUP_LABELS: Record<string, string> = {
  name: 'Name',
  old: 'Old address',
  new: 'New address',
}

interface Props {
  headers: string[]
  initialMapping: ColumnMapping
  sampleRows: Record<string, string>[]
  onConfirm: (mapping: ColumnMapping) => void
}

export default function ColumnMapper({ headers, initialMapping, sampleRows, onConfirm }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => ({ ...initialMapping }))

  const preview = useMemo(() => sampleRows.slice(0, 3), [sampleRows])

  function setField(key: keyof ColumnMapping, value: string) {
    setMapping(prev => ({ ...prev, [key]: value || undefined }))
  }

  function getSample(header: string): string {
    const vals = preview.map(r => r[header]).filter(Boolean)
    return vals.length > 0 ? vals.join(', ') : ''
  }

  const canConfirm = mapping.newZip && (mapping.firstName || mapping.lastName)

  const groups = ['name', 'old', 'new'] as const

  return (
    <div className="mt-4 border border-amber/30 rounded bg-white overflow-hidden">
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-amber-bg border-b border-amber/20">
        <p className="text-sm font-medium text-amber">We couldn't auto-detect some columns</p>
        <p className="text-xs text-amber/80 mt-0.5">Map your CSV columns below. At minimum, pick a name and a new zip.</p>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        {groups.map(group => {
          const fields = FIELDS.filter(f => f.group === group)
          return (
            <div key={group}>
              <p className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{GROUP_LABELS[group]}</p>
              <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
                {fields.map(field => {
                  const current = mapping[field.key] || ''
                  return (
                    <div key={field.key}>
                      <label className="text-sm text-ink-2 mb-1 block">
                        {field.label}
                        {field.required && <span className="text-accent ml-0.5">*</span>}
                      </label>
                      <select
                        value={current}
                        onChange={e => setField(field.key, e.target.value)}
                        className={`w-full bg-white border rounded py-2 px-2.5 text-sm focus:outline-none focus:border-accent ${
                          current ? 'border-green/40 text-ink' : 'border-border text-ink-3'
                        }`}
                      >
                        <option value="">- skip -</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      {current && (
                        <span className="text-xs text-ink-3 truncate block mt-0.5">
                          e.g. {getSample(current) || '(empty)'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-t border-border bg-surface-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-ink-3">
          {canConfirm
            ? 'Looks good - click confirm to continue.'
            : 'Pick at least a name column and a new zip column.'}
        </p>
        <button
          onClick={() => onConfirm(mapping)}
          disabled={!canConfirm}
          className="bg-accent text-white px-5 py-2 text-sm font-medium rounded hover:bg-accent-hover disabled:opacity-25 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
        >
          Confirm mapping
        </button>
      </div>
    </div>
  )
}
