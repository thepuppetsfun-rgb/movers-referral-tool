import { useState, useEffect, useMemo, useRef } from 'react'
import { Copy, Check, Download, Pencil, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import type { MatchedGroup, SenderInfo } from '../types'
import { getDefaultTemplate, generateEmailBody, generateMailtoUrl, generateSubject } from '../lib/email-generator'

interface Props {
  matched: MatchedGroup[]
}

export default function StepEmail({ matched }: Props) {
  const [sender, setSender] = useState<SenderInfo>(() => {
    const fallback = { name: '', chabadHouse: '', phone: '', email: '' }
    try {
      const saved = localStorage.getItem('movers-sender-info')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed.name === 'string') return parsed
      }
    } catch {}
    return fallback
  })

  const hasSenderInfo = sender.name || sender.chabadHouse
  const defaultTemplate = useMemo(() => getDefaultTemplate(sender), [sender])
  const [template, setTemplate] = useState(defaultTemplate)
  const [settingsOpen, setSettingsOpen] = useState(!hasSenderInfo)
  const [copied, setCopied] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const templateRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try { localStorage.setItem('movers-sender-info', JSON.stringify(sender)) } catch {}
  }, [sender])

  useEffect(() => {
    setTemplate(defaultTemplate)
    setEdits({})
  }, [defaultTemplate])

  useEffect(() => {
    if (templateRef.current && settingsOpen) {
      templateRef.current.style.height = 'auto'
      templateRef.current.style.height = templateRef.current.scrollHeight + 'px'
    }
  }, [template, settingsOpen])

  function getBody(group: MatchedGroup) {
    if (edits[group.center.id]) return edits[group.center.id]
    return generateEmailBody(group, template)
  }

  function handleTemplateChange(value: string) {
    if (!value.includes('{movers}')) return
    setTemplate(value)
    setEdits({})
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function startEditing(centerId: string, body: string) {
    setEditing(centerId)
    if (!(centerId in edits)) {
      setEdits(prev => ({ ...prev, [centerId]: body }))
    }
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function exportCsv() {
    const rows = [['Shliach', 'Center', 'Phone', 'Website', 'Chabad.org', 'Families']]
    for (const group of matched) {
      const families = group.movers.map(m => `${m.firstName} ${m.lastName}`.trim()).join('; ')
      rows.push([group.center.shliach, group.center.name, group.center.phone, group.center.website, group.center.url, families])
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'movers-referrals.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const inp = "w-full bg-white border border-border rounded py-2 px-3 text-sm placeholder:text-ink-3/40 focus:outline-none focus:border-ink-3"

  const senderSummary = [sender.name, sender.chabadHouse].filter(Boolean).join(' - ')

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl">{matched.length} {matched.length === 1 ? 'email' : 'emails'} ready</h2>
      </div>
      <p className="text-sm text-ink-3 mb-4">Click any email to edit it. Use the settings below to customize your signature and template.</p>

      {/* Settings panel */}
      <div className="border border-border rounded bg-white overflow-hidden mb-5">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-full px-3 py-2.5 sm:px-4 flex items-center justify-between text-sm text-ink-2 hover:bg-surface-2 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-ink-3" />
            {settingsOpen ? 'Your info & template' : (
              senderSummary
                ? <span className="text-ink-3">Your info: <span className="text-ink">{senderSummary}</span></span>
                : 'Set up your info & template'
            )}
          </span>
          {settingsOpen ? <ChevronUp className="h-4 w-4 text-ink-3" /> : <ChevronDown className="h-4 w-4 text-ink-3" />}
        </button>

        {settingsOpen && (
          <div className="border-t border-border/50">
            {/* Sender info */}
            <div className="p-3 sm:p-4 bg-surface-2/50">
              <p className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Your signature</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input placeholder="Your name" value={sender.name} onChange={e => setSender({ ...sender, name: e.target.value })} className={inp} />
                <input placeholder="Your Chabad House" value={sender.chabadHouse} onChange={e => setSender({ ...sender, chabadHouse: e.target.value })} className={inp} />
                <input placeholder="Phone" value={sender.phone} onChange={e => setSender({ ...sender, phone: e.target.value })} className={inp} />
                <input placeholder="Email" value={sender.email} onChange={e => setSender({ ...sender, email: e.target.value })} className={inp} />
              </div>
              <p className="text-xs text-ink-3/50 mt-2">Saved locally for next time.</p>
            </div>

            {/* Template */}
            <div className="border-t border-border/50">
              <p className="text-xs font-medium text-ink-3 uppercase tracking-wide px-3 sm:px-4 pt-3">Email template</p>
              <textarea
                ref={templateRef}
                value={template}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-3 sm:px-4 text-sm text-ink-2 font-sans leading-relaxed resize-none focus:outline-none"
                style={{ minHeight: '180px' }}
              />
              <p className="px-3 sm:px-4 pb-3 text-xs text-ink-3/50">
                <code className="bg-surface-2 px-1.5 py-0.5 rounded text-ink-3">{'{movers}'}</code> is replaced with each center's mover list.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Email cards */}
      <div className="space-y-3">
        {matched.map(group => {
          const body = getBody(group)
          const subject = generateSubject(group)
          const mailto = generateMailtoUrl({ to: '', subject, body })
          const isCopied = copied === group.center.id
          const isEditing = editing === group.center.id
          const isEdited = group.center.id in edits

          return (
            <div key={group.center.id} className="border border-border rounded bg-white overflow-hidden">
              <div className="px-3 py-2.5 sm:px-4 border-b border-border/50 flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-ink truncate block">{group.center.shliach || group.center.name}</span>
                  {group.center.shliach && <span className="text-ink-3 text-xs sm:text-sm truncate block">{group.center.name}</span>}
                </div>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(`${group.center.name} ${group.center.city} ${group.center.state} email`)}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline shrink-0">find email</a>
              </div>

              {isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={e => setEdits(prev => ({ ...prev, [group.center.id]: e.target.value }))}
                  onBlur={() => setEditing(null)}
                  className="w-full px-3 py-3 sm:px-4 text-sm text-ink-2 bg-white font-sans leading-relaxed resize-none focus:outline-none min-h-[200px]"
                />
              ) : (
                <div
                  onClick={() => startEditing(group.center.id, body)}
                  className="px-3 py-3 sm:px-4 text-sm text-ink-2 bg-surface whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto custom-scroll cursor-text hover:bg-surface-2 transition-colors relative group"
                >
                  {body}
                  <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-ink-3">
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                </div>
              )}

              <div className="px-3 py-2.5 sm:px-4 border-t border-border/50 flex items-center gap-2">
                <a href={mailto} className="bg-accent text-white px-3.5 py-1.5 text-xs font-medium rounded hover:bg-accent-hover">
                  Email
                </a>
                <button
                  onClick={() => copyToClipboard(body, group.center.id)}
                  className={`flex items-center gap-1 px-3.5 py-1.5 text-xs rounded ${
                    isCopied ? 'bg-green-bg text-green' : 'bg-surface-2 text-ink-3 hover:text-ink'
                  }`}
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                {isEdited && (
                  <button
                    onClick={() => setEdits(prev => { const next = { ...prev }; delete next[group.center.id]; return next })}
                    className="text-xs text-ink-3 hover:text-ink ml-auto"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Export at the bottom, out of the way */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-ink-3">Prefer a spreadsheet?</span>
        <button onClick={exportCsv} className="text-sm text-ink-3 hover:text-ink flex items-center gap-1.5 bg-surface-2 border border-border rounded px-3 py-1.5">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
    </div>
  )
}
