import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Cloud,
  CloudOff,
  Edit3,
  Eye,
  LogIn,
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
  createDeck,
  deleteDeck,
  deleteDeckImage,
  getSession,
  isCloudConfigured,
  isCurrentUserGuideAdmin,
  loadCivilizations,
  loadPublicGuides,
  saveCivilization,
  saveDeck,
  savePublicGuide,
  signInWithDiscord,
  signOut,
  supabase,
  uploadDeckImage,
} from './lib/supabase'
import type { Civilization, DeckPreset, GuideField, MatchupGuide } from './types'
import './styles.css'

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

type SaveState = 'public' | 'loading' | 'saving' | 'saved' | 'error'

function RoutedApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [civilizations, setCivilizations] = useState(seededCivilizations)
  const [guides, setGuides] = useState<Record<string, MatchupGuide>>({})
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>(isCloudConfigured ? 'loading' : 'public')
  const [notice, setNotice] = useState('')

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
  const editable = Boolean(session && isAdmin && editMode)

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

  const publishedCount = useMemo(
    () =>
      Object.values(guides).filter((item) =>
        [item.overview, item.gamePlan, item.opening, item.keyUnits, item.timings, item.threats, item.notes]
          .some((value) => value.trim()),
      ).length,
    [guides],
  )

  useEffect(() => {
    if (!isCloudConfigured) return
    let cancelled = false
    setSaveState('loading')
    void Promise.all([loadCivilizations(), loadPublicGuides()])
      .then(([loadedCivilizations, loadedGuides]) => {
        if (cancelled) return
        if (loadedCivilizations.length) setCivilizations(loadedCivilizations)
        setGuides(Object.fromEntries(
          loadedGuides.map((item) => [guideKey(item.civilizationId, item.opponentId), item]),
        ))
        setSaveState('public')
      })
      .catch(() => {
        if (!cancelled) {
          setSaveState('error')
          setNotice('The cloud guide could not be loaded. Showing bundled reference content.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const applySession = async (nextSession: Session | null) => {
      if (cancelled) return
      setSession(nextSession)
      setEditMode(false)
      if (!nextSession) {
        setIsAdmin(false)
        return
      }
      try {
        const allowed = await isCurrentUserGuideAdmin()
        if (!cancelled) {
          setIsAdmin(allowed)
          if (!allowed) setNotice('This Discord account has viewer access only.')
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false)
          setNotice('Admin access could not be verified.')
        }
      }
    }

    void getSession().then(applySession)
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })
    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

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
  const currentCivilization: Civilization = active
  const defaultOpponent = civilizations.find((item) => item.id !== active.id)!

  function updateCivilizationInState(updated: Civilization) {
    setCivilizations((current) =>
      current.map((item) => item.id === updated.id ? updated : item),
    )
  }

  function updateDeckInState(civilizationId: string, updatedDeck: DeckPreset) {
    setCivilizations((current) => current.map((civilization) =>
      civilization.id === civilizationId
        ? {
            ...civilization,
            profile: {
              ...civilization.profile,
              decks: civilization.profile.decks.map((deck) =>
                deck.id === updatedDeck.id ? updatedDeck : deck,
              ),
            },
          }
        : civilization,
    ))
  }

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
    if (!guide || !key || !editable) return
    setGuides((current) => ({
      ...current,
      [key]: { ...guide, [field]: value, updatedAt: new Date().toISOString() },
    }))
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
      setNotice('Discord sign-in could not be started.')
    }
  }

  async function runAdminAction(action: () => Promise<void>, successMessage: string) {
    if (!editable) return
    setSaveState('saving')
    try {
      await action()
      setSaveState('saved')
      setNotice(successMessage)
      window.setTimeout(() => setSaveState('public'), 1200)
    } catch (error) {
      console.error(error)
      setSaveState('error')
      setNotice(error instanceof Error ? error.message : 'The change could not be saved.')
    }
  }

  function handleSaveGuide() {
    if (!guide || !key) return
    void runAdminAction(async () => {
      const saved = await savePublicGuide(guide)
      setGuides((current) => ({ ...current, [key]: saved }))
    }, 'Matchup guide published.')
  }

  function handleSaveCivilization() {
    void runAdminAction(
      () => saveCivilization(currentCivilization),
      `${currentCivilization.name} profile published.`,
    )
  }

  function handleCreateDeck() {
    void runAdminAction(async () => {
      const deck = await createDeck(currentCivilization.id, 'Untitled deck')
      updateCivilizationInState({
        ...currentCivilization,
        profile: {
          ...currentCivilization.profile,
          decks: [...currentCivilization.profile.decks, deck],
        },
      })
    }, 'New deck added.')
  }

  function handleSaveDeck(deck: DeckPreset) {
    void runAdminAction(() => saveDeck(deck), 'Deck published.')
  }

  function handleDeleteDeck(deck: DeckPreset) {
    if (!confirm(`Delete “${deck.title}”? This also removes its uploaded screenshot.`)) return
    void runAdminAction(async () => {
      await deleteDeck(deck)
      updateCivilizationInState({
        ...currentCivilization,
        profile: {
          ...currentCivilization.profile,
          decks: currentCivilization.profile.decks.filter((item) => item.id !== deck.id),
        },
      })
    }, 'Deck deleted.')
  }

  function handleDeckImageUpload(deck: DeckPreset, file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Use a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice('Deck screenshots must be smaller than 10 MB.')
      return
    }
    void runAdminAction(async () => {
      const oldPath = deck.storagePath
      const uploaded = await uploadDeckImage(currentCivilization.id, file)
      const updated = {
        ...deck,
        imagePath: uploaded.publicUrl,
        storagePath: uploaded.path,
      }
      try {
        await saveDeck(updated)
      } catch (error) {
        await deleteDeckImage(uploaded.path)
        throw error
      }
      updateDeckInState(currentCivilization.id, updated)
      if (oldPath) await deleteDeckImage(oldPath)
    }, 'Deck screenshot uploaded.')
  }

  function handleMoveDeck(deck: DeckPreset, direction: number) {
    const decks = [...currentCivilization.profile.decks]
    const index = decks.findIndex((item) => item.id === deck.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= decks.length) return
    ;[decks[index], decks[target]] = [decks[target], decks[index]]
    const reordered = decks.map((item, order) => ({ ...item, sortOrder: order + 1 }))
    updateCivilizationInState({
      ...currentCivilization,
      profile: { ...currentCivilization.profile, decks: reordered },
    })
    void runAdminAction(
      () => Promise.all(reordered.map((item) => saveDeck(item))).then(() => undefined),
      'Deck order updated.',
    )
  }

  const hasPublishedNotes = (civilizationId: string) =>
    Object.values(guides).some(
      (item) =>
        item.civilizationId === civilizationId &&
        [item.overview, item.gamePlan, item.opening, item.keyUnits, item.timings, item.threats, item.notes]
          .some((value) => value.trim()),
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
          <span>Public guide</span>
          <small>{publishedCount} matchups published</small>
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
              {hasPublishedNotes(item.id) && <span className="note-indicator" title="Has published matchups" />}
            </button>
          ))}
          {!filteredCivilizations.length && <p className="empty-list">No civilizations match that search.</p>}
        </nav>

        <div className="sidebar-footer">
          {!isCloudConfigured ? (
            <div className="setup-note"><CloudOff size={16} /><span>Add Supabase keys to load the public guide.</span></div>
          ) : session ? (
            <div className="account">
              <img src={session.user.user_metadata.avatar_url} alt="" />
              <span>
                <strong>{session.user.user_metadata.full_name ?? 'Commander'}</strong>
                <small>{isAdmin ? 'Guide administrator' : 'Viewer access'}</small>
              </span>
              <button className="icon-button" onClick={() => void signOut()} title="Sign out"><LogOut size={16} /></button>
            </div>
          ) : (
            <button className="discord-button admin-login" onClick={() => void handleDiscordLogin()}>
              <LogIn size={17} /> Admin sign in
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
          {isAdmin && (
            <button
              className={`edit-mode-button ${editMode ? 'active' : ''}`}
              type="button"
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? <Eye size={14} /> : <Edit3 size={14} />}
              {editMode ? 'Preview' : 'Edit guide'}
            </button>
          )}
          <div className={`save-state ${saveState}`}>
            {saveState === 'saving' || saveState === 'loading'
              ? <Cloud size={15} />
              : saveState === 'error'
                ? <CloudOff size={15} />
                : <Check size={15} />}
            <span>
              {saveState === 'loading' ? 'Loading guide'
                : saveState === 'saving' ? 'Publishing'
                  : saveState === 'error' ? 'Cloud unavailable'
                    : saveState === 'saved' ? 'Published'
                      : 'Public guide'}
            </span>
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
              editable={editable}
              saving={saveState === 'saving'}
              onOpponentChange={(id) => navigate(`/civilizations/${active.id}/matchups/${id}`)}
              onGuideChange={updateGuide}
              onSave={handleSaveGuide}
            />
          ) : (
            <CivilizationProfile
              civilization={active}
              editable={editable}
              saving={saveState === 'saving'}
              onCivilizationChange={updateCivilizationInState}
              onSave={handleSaveCivilization}
              onDeckChange={(deck) => updateDeckInState(active.id, deck)}
              onDeckSave={handleSaveDeck}
              onDeckCreate={handleCreateDeck}
              onDeckDelete={handleDeleteDeck}
              onDeckImageUpload={handleDeckImageUpload}
              onDeckMove={handleMoveDeck}
            />
          )}

          <footer className="page-footer">
            <span>Field Notes</span>
            <p>{isMatchup ? 'One curated strategy guide, shared with every visitor.' : 'Know the civilization before reading the battlefield.'}</p>
          </footer>
        </div>
      </main>
      {notice && <div className="app-notice" role="status">{notice}</div>}
    </div>
  )
}

export default RoutedApp
