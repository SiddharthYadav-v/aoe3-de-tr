import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  LogOut,
  Menu,
  Search,
  Shield,
  Sparkles,
  Swords,
  X,
} from 'lucide-react'
import { civilizations as seededCivilizations } from './data/civilizations'
import {
  getSession,
  isCloudConfigured,
  loadCivilizations,
  loadCloudGuides,
  saveCloudGuide,
  signInWithDiscord,
  signOut,
  supabase,
} from './lib/supabase'
import type { GuideField, MatchupGuide } from './types'
import './styles.css'

const STORAGE_KEY = 'aoe3-field-notes-v2'

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

function guideKey(civilizationId: string, opponentId: string) {
  return `${civilizationId}__${opponentId}`
}

function emptyGuide(civilizationId: string, opponentId: string): MatchupGuide {
  return {
    civilizationId,
    opponentId,
    overview: '',
    gamePlan: '',
    opening: '',
    keyUnits: '',
    timings: '',
    threats: '',
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}

function readLocalGuides(): Record<string, MatchupGuide> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function App() {
  const [civilizations, setCivilizations] = useState(seededCivilizations)
  const [activeId, setActiveId] = useState('british')
  const [opponentId, setOpponentId] = useState('french')
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guides, setGuides] = useState<Record<string, MatchupGuide>>(readLocalGuides)
  const [pendingGuide, setPendingGuide] = useState<MatchupGuide | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'local' | 'error'>(
    isCloudConfigured ? 'saved' : 'local',
  )

  const active = civilizations.find((item) => item.id === activeId) ?? civilizations[0]
  const opponent = civilizations.find((item) => item.id === opponentId) ?? civilizations[1]
  const key = guideKey(active.id, opponent.id)
  const guide = guides[key] ?? emptyGuide(active.id, opponent.id)

  const filteredCivilizations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return civilizations.filter(
      (item) =>
        (region === 'All' || item.region === region) &&
        (!normalized ||
          item.name.toLowerCase().includes(normalized) ||
          item.strengths.some((strength) => strength.toLowerCase().includes(normalized))),
    )
  }, [civilizations, query, region])

  const completedCount = useMemo(
    () =>
      Object.values(guides).filter((item) =>
        [item.gamePlan, item.opening, item.keyUnits, item.timings, item.threats].every(
          (value) => value.trim().length > 0,
        ),
      ).length,
    [guides],
  )

  useEffect(() => {
    if (!isCloudConfigured) return
    void loadCivilizations()
      .then((items) => {
        if (items.length) setCivilizations(items)
      })
      .catch(() => {
        // The bundled seed remains available when reference data cannot sync.
      })
  }, [])

  useEffect(() => {
    void getSession().then(setSession)
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    void loadCloudGuides()
      .then((cloudGuides) => {
        if (cancelled) return
        setGuides((current) => {
          const merged = { ...current }
          cloudGuides.forEach((item) => {
            merged[guideKey(item.civilizationId, item.opponentId)] = item
          })
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return merged
        })
        setSaveState('saved')
      })
      .catch(() => setSaveState('error'))
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!pendingGuide) return
    setSaveState(session ? 'saving' : 'local')
    const timer = window.setTimeout(() => {
      if (!session) {
        setPendingGuide(null)
        return
      }
      void saveCloudGuide(pendingGuide)
        .then((saved) => {
          setGuides((current) => ({
            ...current,
            [guideKey(saved.civilizationId, saved.opponentId)]: saved,
          }))
          setSaveState('saved')
          setPendingGuide(null)
        })
        .catch(() => setSaveState('error'))
    }, 650)
    return () => window.clearTimeout(timer)
  }, [pendingGuide, session])

  function selectCivilization(id: string) {
    setActiveId(id)
    if (id === opponentId) {
      setOpponentId(civilizations.find((item) => item.id !== id)?.id ?? '')
    }
    setSidebarOpen(false)
  }

  function updateGuide(field: GuideField, value: string) {
    const updated = { ...guide, [field]: value, updatedAt: new Date().toISOString() }
    const next = { ...guides, [key]: updated }
    setGuides(next)
    setPendingGuide(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function stepCivilization(direction: number) {
    const index = civilizations.findIndex((item) => item.id === active.id)
    const next = civilizations[(index + direction + civilizations.length) % civilizations.length]
    selectCivilization(next.id)
  }

  async function handleDiscordLogin() {
    try {
      await signInWithDiscord()
    } catch {
      setSaveState('error')
    }
  }

  const regions = ['All', ...new Set(civilizations.map((item) => item.region))]
  const activeHasNotes = (civilizationId: string) =>
    Object.values(guides).some(
      (item) =>
        item.civilizationId === civilizationId &&
        Object.entries(item).some(
          ([field, value]) =>
            !['civilizationId', 'opponentId', 'updatedAt', 'id'].includes(field) &&
            String(value).trim(),
        ),
    )

  return (
    <div className="app-shell">
      <button
        className={`mobile-scrim ${sidebarOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Swords size={20} /></div>
          <div>
            <p>AoE III DE</p>
            <h1>Field Notes</h1>
          </div>
          <button className="icon-button close-sidebar" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>

        <div className="library-heading">
          <span>War room</span>
          <small>{completedCount} complete</small>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search civilizations…" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
        </label>

        <div className="region-tabs" aria-label="Filter by region">
          {regions.map((item) => (
            <button key={item} className={region === item ? 'active' : ''} onClick={() => setRegion(item)}>
              {item}
            </button>
          ))}
        </div>

        <nav className="civilization-list">
          {filteredCivilizations.map((item) => (
            <button
              key={item.id}
              className={`civilization-item ${item.id === active.id ? 'active' : ''}`}
              onClick={() => selectCivilization(item.id)}
            >
              <img className="civ-flag" src={item.flagPath} alt="" />
              <span className="civ-meta"><strong>{item.name}</strong><small>{item.region}</small></span>
              {activeHasNotes(item.id) && <span className="note-indicator" title="Has field notes" />}
            </button>
          ))}
          {!filteredCivilizations.length && <p className="empty-list">No civilizations match that search.</p>}
        </nav>

        <div className="sidebar-footer">
          {!isCloudConfigured ? (
            <div className="setup-note"><CloudOff size={16} /><span>Add Supabase keys to enable cloud sync.</span></div>
          ) : session ? (
            <div className="account">
              <img src={session.user.user_metadata.avatar_url} alt="" />
              <span><strong>{session.user.user_metadata.full_name ?? 'Commander'}</strong><small>Synced to cloud</small></span>
              <button className="icon-button" onClick={() => void signOut()} title="Sign out"><LogOut size={16} /></button>
            </div>
          ) : (
            <button className="discord-button" onClick={() => void handleDiscordLogin()}>
              <Cloud size={17} /> Continue with Discord
            </button>
          )}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><BookOpen size={15} /><span>Matchup library</span><b>/</b><strong>{active.name}</strong></div>
          <div className={`save-state ${saveState}`}>
            {saveState === 'saving' ? <Cloud size={15} /> : saveState === 'error' ? <CloudOff size={15} /> : <Check size={15} />}
            <span>{saveState === 'saving' ? 'Saving' : saveState === 'error' ? 'Sync failed' : saveState === 'local' ? 'Saved locally' : 'Cloud synced'}</span>
          </div>
        </header>

        <div className="page">
          <section className="hero">
            <div className="hero-flag">
              <img src={active.flagPath} alt={`${active.name} flag`} />
            </div>
            <div className="hero-copy">
              <p className="eyebrow"><Shield size={13} /> {active.region} civilization</p>
              <h2>{active.name}</h2>
              <p>{active.summary}</p>
              <div className="strength-list">
                {active.strengths.map((strength) => <span key={strength}>{strength}</span>)}
              </div>
            </div>
            <div className="page-navigation">
              <button onClick={() => stepCivilization(-1)} aria-label="Previous civilization"><ArrowLeft size={18} /></button>
              <button onClick={() => stepCivilization(1)} aria-label="Next civilization"><ArrowRight size={18} /></button>
            </div>
          </section>

          <section className="identity-card">
            <div><Sparkles size={18} /><span><strong>Civilization read</strong><small>Keep this matchup-specific</small></span></div>
            <textarea
              value={guide.overview}
              onChange={(event) => updateGuide('overview', event.target.value)}
              placeholder={`How does ${active.name} approach this particular matchup?`}
            />
          </section>

          <section className="matchup-card">
            <header className="matchup-header">
              <div className="versus-lockup">
                <img className="mini-flag" src={active.flagPath} alt={`${active.name} flag`} />
                <Swords size={18} />
                <img className="mini-flag" src={opponent.flagPath} alt={`${opponent.name} flag`} />
              </div>
              <div>
                <p>Matchup dossier</p>
                <h3>{active.name} <em>vs.</em> {opponent.name}</h3>
              </div>
              <label className="opponent-select">
                <span>Opponent</span>
                <select value={opponent.id} onChange={(event) => setOpponentId(event.target.value)}>
                  {civilizations.filter((item) => item.id !== active.id).map((item) => (
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
                    onChange={(event) => updateGuide(field.id, event.target.value)}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}
            </div>
          </section>

          <footer className="page-footer">
            <span>Field Notes</span>
            <p>Every pairing is an independent living guide.</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
