import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Cloud,
  CloudOff,
  LogOut,
  Menu,
  Search,
  Shield,
  Swords,
  X,
} from 'lucide-react'
import { Link, Navigate, matchPath, useLocation, useNavigate } from 'react-router-dom'
import { CivilizationProfile } from './components/CivilizationProfile'
import { MatchupPage } from './components/MatchupPage'
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

function RoutedApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [civilizations, setCivilizations] = useState(seededCivilizations)
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guides, setGuides] = useState<Record<string, MatchupGuide>>(readLocalGuides)
  const [pendingGuide, setPendingGuide] = useState<MatchupGuide | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'local' | 'error'>(
    isCloudConfigured ? 'saved' : 'local',
  )

  const matchupRoute = matchPath(
    { path: '/civilizations/:civilizationId/matchups/:opponentId', end: true },
    location.pathname,
  )
  const profileRoute = matchPath(
    { path: '/civilizations/:civilizationId', end: true },
    location.pathname,
  )
  const activeId = matchupRoute?.params.civilizationId ?? profileRoute?.params.civilizationId
  const isMatchup = Boolean(matchupRoute)
  const active = civilizations.find((item) => item.id === activeId)
  const fallbackOpponent = civilizations.find((item) => item.id !== activeId)
  const opponent = civilizations.find(
    (item) => item.id === matchupRoute?.params.opponentId && item.id !== activeId,
  )
  const selectedOpponent = opponent ?? fallbackOpponent
  const key = active && selectedOpponent ? guideKey(active.id, selectedOpponent.id) : ''
  const guide = active && selectedOpponent
    ? guides[key] ?? emptyGuide(active.id, selectedOpponent.id)
    : null

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
        // Bundled reference data remains available when cloud metadata is offline.
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

  if (!activeId) {
    return <Navigate to="/civilizations/british" replace />
  }
  if (!active) {
    return <Navigate to="/civilizations/british" replace />
  }
  if (isMatchup && (!opponent || !selectedOpponent)) {
    return (
      <Navigate
        to={`/civilizations/${active.id}/matchups/${fallbackOpponent?.id ?? 'british'}`}
        replace
      />
    )
  }

  const regions = ['All', ...new Set(civilizations.map((item) => item.region))]
  const defaultOpponent = civilizations.find((item) => item.id !== active.id)!

  function selectCivilization(id: string) {
    if (isMatchup) {
      const nextOpponent = selectedOpponent?.id === id
        ? civilizations.find((item) => item.id !== id)?.id
        : selectedOpponent?.id
      navigate(`/civilizations/${id}/matchups/${nextOpponent}`)
    } else {
      navigate(`/civilizations/${id}`)
    }
    setSidebarOpen(false)
  }

  function updateGuide(field: GuideField, value: string) {
    if (!guide || !key) return
    const updated = { ...guide, [field]: value, updatedAt: new Date().toISOString() }
    const next = { ...guides, [key]: updated }
    setGuides(next)
    setPendingGuide(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function stepCivilization(direction: number) {
    const index = civilizations.findIndex((item) => item.id === activeId)
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
          <span>Civilizations</span>
          <small>{completedCount} matchups complete</small>
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
          <div className="breadcrumb">
            <BookOpen size={15} />
            <Link to={`/civilizations/${active.id}`}>{active.name}</Link>
            {isMatchup && <><b>/</b><strong>{selectedOpponent?.name} matchup</strong></>}
          </div>
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

          <nav className="page-tabs" aria-label={`${active.name} pages`}>
            <Link className={!isMatchup ? 'active' : ''} to={`/civilizations/${active.id}`}>
              Civilization
            </Link>
            <Link
              className={isMatchup ? 'active' : ''}
              to={`/civilizations/${active.id}/matchups/${selectedOpponent?.id ?? defaultOpponent.id}`}
            >
              Matchups
            </Link>
          </nav>

          {isMatchup && selectedOpponent && guide ? (
            <MatchupPage
              civilization={active}
              opponent={selectedOpponent}
              civilizations={civilizations}
              guide={guide}
              onOpponentChange={(id) => navigate(`/civilizations/${active.id}/matchups/${id}`)}
              onGuideChange={updateGuide}
            />
          ) : (
            <CivilizationProfile civilization={active} />
          )}

          <footer className="page-footer">
            <span>Field Notes</span>
            <p>{isMatchup ? 'Every pairing is an independent living guide.' : 'Know the civilization before reading the battlefield.'}</p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default RoutedApp
