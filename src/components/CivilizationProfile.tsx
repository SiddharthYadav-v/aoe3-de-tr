import { ExternalLink, Landmark, Play, ShieldCheck, Sparkles, Swords } from 'lucide-react'
import type { Civilization } from '../types'
import { DeckCarousel } from './DeckCarousel'

interface CivilizationProfileProps {
  civilization: Civilization
}

export function CivilizationProfile({ civilization }: CivilizationProfileProps) {
  const { profile } = civilization
  const youtubeUrl = profile.boomingVideoId
    ? `https://www.youtube.com/watch?v=${profile.boomingVideoId}`
    : null

  return (
    <div className="profile-page">
      <section className="profile-intro">
        <div className="section-heading">
          <div>
            <p>Commander's brief</p>
            <h3>How {civilization.name} plays</h3>
          </div>
          <span>Reference guide</span>
        </div>

        <div className="profile-detail-grid">
          <article className="profile-detail primary">
            <Sparkles size={19} />
            <div>
              <span>Strategic identity</span>
              <p>{profile.playstyle}</p>
            </div>
          </article>
          <article className="profile-detail">
            <Landmark size={19} />
            <div>
              <span>Economy</span>
              <p>{profile.economy}</p>
            </div>
          </article>
          <article className="profile-detail">
            <Swords size={19} />
            <div>
              <span>Military</span>
              <p>{profile.military}</p>
            </div>
          </article>
        </div>

        <div className="mechanics-strip">
          <div><ShieldCheck size={18} /><span>Key mechanics</span></div>
          <ul>
            {profile.keyMechanics.map((mechanic) => <li key={mechanic}>{mechanic}</li>)}
          </ul>
        </div>
      </section>

      <section className="profile-media-grid">
        <article className="profile-panel video-panel">
          <div className="section-heading compact">
            <div>
              <p>Build order</p>
              <h3>Booming guide</h3>
            </div>
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noreferrer">
                YouTube <ExternalLink size={14} />
              </a>
            )}
          </div>
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
                <p>Add a YouTube video ID to this civilization in <code>civilizations.ts</code>.</p>
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
          <DeckCarousel civilization={civilization} />
        </article>
      </section>
    </div>
  )
}
