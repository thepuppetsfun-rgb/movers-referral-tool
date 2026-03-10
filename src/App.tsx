import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Github } from 'lucide-react'
import StepUpload from './components/StepUpload'
import StepReview from './components/StepReview'
import StepMatch from './components/StepMatch'
import StepEmail from './components/StepEmail'
import FAQ from './components/FAQ'
import type { Mover, MatchedGroup, UnmatchedGroup, WizardStep } from './types'
import type { ParseResult } from './lib/csv-parse'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'review', label: 'Review' },
  { key: 'match', label: 'Match' },
  { key: 'email', label: 'Send' },
]

export default function App() {
  const [step, setStep] = useState<WizardStep>('upload')
  const [movers, setMovers] = useState<Mover[]>([])
  const [matched, setMatched] = useState<MatchedGroup[]>([])
  const [, setUnmatched] = useState<UnmatchedGroup[]>([])
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)


  const stepIdx = STEPS.findIndex(s => s.key === step)
  const activeMovers = useMemo(() => movers.filter(m => !m.excluded), [movers])

  function handleParsed(result: ParseResult) {
    setParseResult(result)
    setMovers(result.movers)
  }

  function canGoNext(): boolean {
    if (step === 'upload') return parseResult !== null && parseResult.movers.length > 0
    if (step === 'review') return movers.some(m => !m.excluded)
    if (step === 'match') return matched.length > 0
    return false
  }

  function goToStep(s: WizardStep) {
    setStep(s)
    window.scrollTo({ top: 0 })
  }

  function next() {
    const idx = STEPS.findIndex(s => s.key === step)
    if (idx < STEPS.length - 1) goToStep(STEPS[idx + 1].key)
  }

  function back() {
    const idx = STEPS.findIndex(s => s.key === step)
    if (idx > 0) goToStep(STEPS[idx - 1].key)
  }

  function reset() {
    setStep('upload')
    setMovers([])
    setMatched([])
    setUnmatched([])
    setParseResult(null)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar - hidden on landing */}
      {step !== 'upload' && (
        <header className="border-b border-border sticky top-0 z-10 bg-surface">
          <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
            <button onClick={reset} className="font-display text-lg tracking-tight hover:text-accent transition-colors">
              Movers Referral
            </button>
            <button onClick={reset} className="text-ink-3 hover:text-accent text-sm flex items-center gap-1.5">
              <RotateCcw className="h-3 w-3" /> Start over
            </button>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-3xl px-5 py-6">
          {/* Hero - only on upload step */}
            {step === 'upload' && (
              <div className="mb-8">
                <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                  When someone moves,<br />
                  <span className="text-accent">connect them</span> to their new shliach.
                </h2>
                <p className="mt-3 text-ink-2 text-[15px] leading-relaxed max-w-lg">
                  Upload your NCOA results. This tool finds who moved, matches them to
                  the closest Chabad House, and writes the referral email - all in
                  about 30 seconds.
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-3">
                  <span>100% private - nothing leaves your browser</span>
                  <span>1,900+ Chabad centers</span>
                  <span>Auto-detects most CSV formats</span>
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="flex gap-1.5 mb-6">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex-1">
                  <button
                    onClick={() => { if (i < stepIdx) goToStep(STEPS[i].key) }}
                    disabled={i > stepIdx}
                    className={`w-full h-1.5 rounded-full transition-colors ${
                      i <= stepIdx ? 'bg-accent' : 'bg-border'
                    } ${i < stepIdx ? 'cursor-pointer hover:bg-accent-hover' : ''}`}
                  />
                  <span className={`block text-xs mt-1.5 ${
                    i === stepIdx ? 'text-ink font-medium' : i < stepIdx ? 'text-ink-3' : 'text-ink-3/40'
                  }`}>{s.label}</span>
                </div>
              ))}
            </div>

            {step === 'upload' && <StepUpload onParsed={handleParsed} onContinue={next} />}
            {step === 'review' && <StepReview movers={movers} onUpdate={setMovers} />}
            {step === 'match' && (
              <StepMatch
                movers={activeMovers}
                onMatched={(m, u) => { setMatched(m); setUnmatched(u) }}
              />
            )}
            {step === 'email' && <StepEmail matched={matched} />}

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              {stepIdx > 0 ? (
                <button onClick={back} className="text-sm text-ink-3 hover:text-ink flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              ) : <div />}
              {stepIdx > 0 && stepIdx < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  disabled={!canGoNext()}
                  className="bg-accent text-white px-5 py-2.5 text-sm font-medium rounded hover:bg-accent-hover disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : <div />}
            </div>

            {step === 'upload' && <FAQ />}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="mx-auto max-w-3xl px-5 py-5 flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-xs text-ink-3 text-center sm:text-left">
          <span>
            Nothing leaves your browser. Center data from{' '}
            <a href="https://www.chabad.org/jewish-centers/" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">chabad.org</a>.
          </span>
          <a href="https://github.com/toolsforshlichus/movers-referral-tool" target="_blank" rel="noopener noreferrer"
            className="hover:text-ink transition-colors flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
