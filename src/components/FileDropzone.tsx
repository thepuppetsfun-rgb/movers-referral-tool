import { useState, useRef, type DragEvent } from 'react'
import { Upload, FileCheck } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
  loading?: boolean
}

export default function FileDropzone({ onFile, loading }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      setFileName(file.name)
      onFile(file)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && isValidFile(file)) {
      setFileName(file.name)
      onFile(file)
    }
  }

  function isValidFile(file: File): boolean {
    const name = file.name.toLowerCase()
    return name.endsWith('.csv') || name.endsWith('.txt')
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        cursor-pointer rounded-lg border-2 border-dashed text-center transition-all
        ${fileName ? 'p-4' : 'p-12 sm:p-16'}
        ${dragging ? 'border-accent bg-accent-bg' : fileName ? 'border-green/40 bg-green-bg' : 'border-border bg-surface-2 hover:border-ink-3/40'}
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input ref={inputRef} type="file" accept=".csv,.txt" onChange={handleChange} className="hidden" />

      {fileName ? (
        <div className="flex items-center gap-3">
          <FileCheck className="h-5 w-5 text-green shrink-0" />
          <span className="text-sm font-medium text-ink-2">{fileName}</span>
          <span className="text-xs text-ink-3 ml-auto">{loading ? 'Reading...' : 'Change file'}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-8 w-8 text-ink-3" />
          <div>
            <p className="text-ink-2 font-medium">Drop your NCOA results here</p>
            <p className="text-xs text-ink-3 mt-1">CSV or TXT</p>
          </div>
        </div>
      )}
    </div>
  )
}
