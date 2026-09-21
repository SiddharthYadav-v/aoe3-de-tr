import { ChevronDown, Sparkles, Swords } from 'lucide-react'
import type { Civilization, GuideField, MatchupGuide } from '../types'

const fieldGroups: Array<{
  id: GuideField
  label: string
  hint: string
  placeholder: string
  wide?: boolean
}> = [
  { id: 'gamePlan', label: 'Game plan', hint: 'The win condition', placeholder: 'What is the shape of a winning game?', wide: true },
  { id: 'opening', label: 'Opening', hint: 'First 8 minutes', placeholder: 'Age-up, first shipments, build order, and early priorities…' },
  { id: 'keyUnits', label: 'Army composition', hint: 'What to make', placeholder: 'Core units, ratios, upgrades, and transitions…' },
  { id: 'timings', label: 'Timing windows', hint: 'When to move', placeholder: 'Power spikes, pressure windows, and fights to avoid…' },
  { id: 'threats', label: 'Threats & answers', hint: 'What to scout', placeholder: 'Likely threats, scouting tells, and your response…' },
  { id: 'notes', label: 'Field notes', hint: 'Lessons learned', placeholder: 'Map notes, reminders, links, and takeaways…', wide: true },
]

interface MatchupPageProps {
  civilization: Civilization
  opponent: Civilization
  civilizations: Civilization[]
  guide: MatchupGuide
  onOpponentChange: (id: string) => void
  onGuideChange: (field: GuideField, value: string) => void
}

export function MatchupPage({
  civilization,
  opponent,
  civilizations,
  guide,
  onOpponentChange,
  onGuideChange,
}: MatchupPageProps) {
  return (
    <div className="matchup-page">
      <section className="identity-card">
        <div><Sparkles size={18} /><span><strong>Matchup read</strong><small>Specific to this pairing</small></span></div>
        <textarea
          value={guide.overview}
          onChange={(event) => onGuideChange('overview', event.target.value)}
          placeholder={`How should ${civilization.name} approach ${opponent.name}?`}
        />
      </section>

      <section className="matchup-card">
        <header className="matchup-header">
          <div className="versus-lockup">
            <img className="mini-flag" src={civilization.flagPath} alt={`${civilization.name} flag`} />
            <Swords size={18} />
            <img className="mini-flag" src={opponent.flagPath} alt={`${opponent.name} flag`} />
          </div>
          <div>
            <p>Matchup dossier</p>
            <h3>{civilization.name} <em>vs.</em> {opponent.name}</h3>
          </div>
          <label className="opponent-select">
            <span>Opponent</span>
            <select value={opponent.id} onChange={(event) => onOpponentChange(event.target.value)}>
              {civilizations.filter((item) => item.id !== civilization.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>
        </header>

        <div className="guide-grid">
          {fieldGroups.map((field, index) => (
            <label className={`guide-field ${field.wide ? 'wide' : ''}`} key={field.id}>
              <span className="field-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="field-title"><strong>{field.label}</strong><small>{field.hint}</small></span>
              <textarea
                value={guide[field.id]}
                onChange={(event) => onGuideChange(field.id, event.target.value)}
                placeholder={field.placeholder}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
