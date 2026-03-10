import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const QUESTIONS = [
  {
    q: "Does my data leave my computer?",
    a: "No. Everything runs in your browser. There is no server, no database, and no account. When you close the tab, the data is gone.",
  },
  {
    q: "How does it find the right shliach?",
    a: "It uses the Chabad.org public center directory. For each mover's new zip code, it calculates which Chabad Houses are geographically closest and shows you the results. If there are several in the area, you'll see all of them.",
  },
  {
    q: "What about areas with no nearby Chabad House?",
    a: "The tool will still show the closest center, even if it's far away. You'll see the distance so you can decide whether it makes sense to reach out.",
  },
  {
    q: "What is NCOA?",
    a: "National Change of Address. You submit your mailing list to an NCOA provider (TrueNCOA, NCOASource, etc.) and they return a file showing who moved and where. Most organizations run NCOA once or twice a year.",
  },
  {
    q: "Which file formats are supported?",
    a: "CSV files from TrueNCOA, NCOASource, Salesforce, and ChabadCMS are auto-detected. Other CSV files work too - if columns aren't recognized, you'll get a simple mapping screen to assign them yourself.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="mt-10">
      <h3 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-2">FAQ</h3>
      <div className="divide-y divide-border border-y border-border">
        {QUESTIONS.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-3.5 text-left text-sm"
            >
              <span className={open === i ? 'text-ink font-medium' : 'text-ink-2'}>{item.q}</span>
              {open === i
                ? <Minus className="h-3.5 w-3.5 text-ink-3 shrink-0 ml-4" />
                : <Plus className="h-3.5 w-3.5 text-ink-3 shrink-0 ml-4" />
              }
            </button>
            {open === i && (
              <p className="pb-3.5 text-sm text-ink-3 leading-relaxed -mt-1">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
