import { Check, ExternalLink, Landmark, Play, ShieldCheck, Sparkles, Swords } from 'lucide-react'
import type { Civilization, DeckPreset } from '../types'
import { DeckCarousel } from './DeckCarousel'

interface CivilizationProfileProps {
  civilization: Civilization
  editable: boolean
  saving: boolean
  onCivilizationChange: (civilization: Civilization) => void
  onSave: () => void
  onDeckChange: (deck: DeckPreset) => void
  onDeckSave: (deck: DeckPreset) => void
  onDeckCreate: () => void
  onDeckDelete: (deck: DeckPreset) => void
  onDeckImageUpload: (deck: DeckPreset, file: File) => void
  onDeckMove: (deck: DeckPreset, direction: number) => void
}

export function CivilizationProfile({
  civilization,
  editable,
  saving,
  onCivilizationChange,
  onSave,
  onDeckChange,
  onDeckSave,
  onDeckCreate,
  onDeckDelete,
  onDeckImageUpload,
  onDeckMove,
}: CivilizationProfileProps) {
  const { profile } = civilization
  const youtubeUrl = profile.boomingVideoId
    ? `https://www.youtube.com/watch?v=${profile.boomingVideoId}`
    : null
  const updateProfile = (field: keyof Civilization['profile'], value: unknown) => {
    onCivilizationChange({
      ...civilization,
      profile: { ...profile, [field]: value },
    })
  }

  return (
    <div className={`profile-page ${editable ? 'editing' : ''}`}>
      <section className="profile-intro">
        <div className="section-heading">
          <div>
            <p>Commander's brief</p>
            <h3>How {civilization.name} plays</h3>
          </div>
          <span>{editable ? 'Admin editor' : 'Reference guide'}</span>
        </div>

        {editable && (
          <div className="profile-basics-editor">
            <label>
              <span>Short summary</span>
              <textarea
                value={civilization.summary}
                onChange={(event) => onCivilizationChange({ ...civilization, summary: event.target.value })}
              />
            </label>
            <label>
              <span>Strengths, separated by commas</span>
              <input
                value={civilization.strengths.join(', ')}
                onChange={(event) => onCivilizationChange({
                  ...civilization,
                  strengths: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                })}
              />
            </label>
          </div>
        )}

        <div className="profile-detail-grid">
          <article className="profile-detail primary">
            <Sparkles size={19} />
            <div>
              <span>Strategic identity</span>
              {editable ? (
                <textarea
                  value={profile.playstyle}
                  onChange={(event) => updateProfile('playstyle', event.target.value)}
                />
              ) : <p>{profile.playstyle}</p>}
            </div>
          </article>
          <article className="profile-detail">
            <Landmark size={19} />
            <div>
              <span>Economy</span>
              {editable ? (
                <textarea
                  value={profile.economy}
                  onChange={(event) => updateProfile('economy', event.target.value)}
                />
              ) : <p>{profile.economy}</p>}
            </div>
          </article>
          <article className="profile-detail">
            <Swords size={19} />
            <div>
              <span>Military</span>
              {editable ? (
                <textarea
                  value={profile.military}
                  onChange={(event) => updateProfile('military', event.target.value)}
                />
              ) : <p>{profile.military}</p>}
            </div>
          </article>
        </div>

        <div className="mechanics-strip">
          <div><ShieldCheck size={18} /><span>Key mechanics</span></div>
          {editable ? (
            <input
              value={profile.keyMechanics.join(', ')}
              onChange={(event) => updateProfile(
                'keyMechanics',
                event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              )}
              aria-label="Key mechanics, separated by commas"
            />
          ) : (
            <ul>
              {profile.keyMechanics.map((mechanic) => <li key={mechanic}>{mechanic}</li>)}
            </ul>
          )}
        </div>

        {editable && (
          <div className="editor-actions profile-save-actions">
            <span>Profile text is public immediately after publishing.</span>
            <button className="primary-action" type="button" onClick={onSave} disabled={saving}>
              <Check size={15} /> {saving ? 'Saving…' : 'Publish profile'}
            </button>
          </div>
        )}
      </section>

      <section className="profile-media-grid">
        <article className="profile-panel video-panel">
          <div className="section-heading compact">
            <div>
              <p>Build order</p>
              <h3>Booming guide</h3>
            </div>
            {youtubeUrl && !editable && (
              <a href={youtubeUrl} target="_blank" rel="noreferrer">
                YouTube <ExternalLink size={14} />
              </a>
            )}
          </div>
          {editable && (
            <label className="video-id-editor">
              <span>YouTube video ID</span>
              <input
                value={profile.boomingVideoId ?? ''}
                placeholder="Example: dQw4w9WgXcQ"
                onChange={(event) => updateProfile('boomingVideoId', event.target.value || null)}
              />
              <small>Use only the ID after <code>watch?v=</code>, then publish the profile above.</small>
            </label>
          )}
          <div className="video-frame">
            {profile.boomingVideoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${profile.boomingVideoId}`}
                title={`${civilization.name} booming guide`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="video-placeholder">
                <span><Play size={23} /></span>
                <strong>Booming video coming soon</strong>
                <p>{editable ? 'Add a YouTube video ID above.' : 'This build-order video has not been published yet.'}</p>
              </div>
            )}
          </div>
        </article>

        <article className="profile-panel decks-panel">
          <div className="section-heading compact">
            <div>
              <p>Home city</p>
              <h3>Deck library</h3>
            </div>
            <span>{profile.decks.length} decks</span>
          </div>
          <DeckCarousel
            civilization={civilization}
            editable={editable}
            busy={saving}
            onDeckChange={onDeckChange}
            onDeckSave={onDeckSave}
            onDeckCreate={onDeckCreate}
            onDeckDelete={onDeckDelete}
            onDeckImageUpload={onDeckImageUpload}
            onDeckMove={onDeckMove}
          />
        </article>
      </section>
    </div>
  )
}
