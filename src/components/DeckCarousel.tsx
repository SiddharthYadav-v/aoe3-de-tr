import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Images,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { Civilization, DeckPreset } from '../types'

interface DeckCarouselProps {
  civilization: Civilization
  editable: boolean
  busy: boolean
  onDeckChange: (deck: DeckPreset) => void
  onDeckSave: (deck: DeckPreset) => void
  onDeckCreate: () => void
  onDeckDelete: (deck: DeckPreset) => void
  onDeckImageUpload: (deck: DeckPreset, file: File) => void
  onDeckMove: (deck: DeckPreset, direction: number) => void
}

function DeckFace({
  deck,
  civilization,
  position,
  onSelect,
}: {
  deck: DeckPreset
  civilization: Civilization
  position: 'previous' | 'active' | 'next'
  onSelect: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = deck.imagePath && !imageFailed

  return (
    <button
      className={`deck-card ${position}`}
      type="button"
      onClick={onSelect}
      aria-label={`${deck.title}${position === 'active' ? ', selected' : ''}`}
      aria-hidden={position !== 'active'}
      tabIndex={position === 'active' ? 0 : -1}
    >
      <div className="deck-art">
        {showImage ? (
          <img src={deck.imagePath!} alt={`${deck.title} deck`} onError={() => setImageFailed(true)} />
        ) : (
          <div className="deck-placeholder" style={{ '--deck-accent': civilization.accent } as CSSProperties}>
            <img src={civilization.flagPath} alt="" />
            <Images size={26} />
            <span>Deck screenshot</span>
            <small>{position === 'active' ? 'Image coming soon' : ''}</small>
          </div>
        )}
      </div>
      <div className="deck-card-copy">
        <span>{civilization.name}</span>
        <strong>{deck.title}</strong>
        <p>{deck.description}</p>
      </div>
    </button>
  )
}

export function DeckCarousel({
  civilization,
  editable,
  busy,
  onDeckChange,
  onDeckSave,
  onDeckCreate,
  onDeckDelete,
  onDeckImageUpload,
  onDeckMove,
}: DeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const decks = civilization.profile.decks

  useEffect(() => setActiveIndex(0), [civilization.id])
  useEffect(() => {
    setActiveIndex((current) => Math.max(0, Math.min(current, decks.length - 1)))
  }, [decks.length])

  if (!decks.length) {
    return (
      <div className="deck-empty">
        <span>No decks have been published for {civilization.name} yet.</span>
        {editable && (
          <button className="primary-action" type="button" onClick={onDeckCreate} disabled={busy}>
            <Plus size={15} /> Add first deck
          </button>
        )}
      </div>
    )
  }

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + decks.length) % decks.length)
  }
  const previousIndex = (activeIndex - 1 + decks.length) % decks.length
  const nextIndex = (activeIndex + 1) % decks.length
  const activeDeck = decks[activeIndex]

  return (
    <div
      className="deck-carousel"
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const distance = event.changedTouches[0].clientX - touchStart.current
        if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1)
        touchStart.current = null
      }}
    >
      <div className="deck-stack" aria-live="polite">
        {decks.length > 1 && (
          <DeckFace
            key={`${civilization.id}-${decks[previousIndex].id}-previous`}
            deck={decks[previousIndex]}
            civilization={civilization}
            position="previous"
            onSelect={() => move(-1)}
          />
        )}
        <DeckFace
          key={`${civilization.id}-${activeDeck.id}-active`}
          deck={activeDeck}
          civilization={civilization}
          position="active"
          onSelect={() => undefined}
        />
        {decks.length > 1 && (
          <DeckFace
            key={`${civilization.id}-${decks[nextIndex].id}-next`}
            deck={decks[nextIndex]}
            civilization={civilization}
            position="next"
            onSelect={() => move(1)}
          />
        )}
      </div>

      <div className="deck-controls">
        <button type="button" onClick={() => move(-1)} aria-label="Previous deck">
          <ArrowLeft size={17} />
        </button>
        <div className="deck-dots" aria-label={`Deck ${activeIndex + 1} of ${decks.length}`}>
          {decks.map((deck, index) => (
            <button
              key={deck.id}
              className={index === activeIndex ? 'active' : ''}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${deck.title}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => move(1)} aria-label="Next deck">
          <ArrowRight size={17} />
        </button>
      </div>

      {editable && (
        <div className="deck-editor">
          <label>
            <span>Deck title</span>
            <input
              value={activeDeck.title}
              onChange={(event) => onDeckChange({ ...activeDeck, title: event.target.value })}
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              value={activeDeck.description}
              onChange={(event) => onDeckChange({ ...activeDeck, description: event.target.value })}
            />
          </label>
          <div className="deck-editor-buttons">
            <label className="secondary-action file-action">
              <Upload size={14} /> Upload screenshot
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onDeckImageUpload(activeDeck, file)
                  event.target.value = ''
                }}
                disabled={busy}
              />
            </label>
            <button type="button" className="secondary-action" onClick={() => onDeckMove(activeDeck, -1)} disabled={busy || decks.length < 2}>
              <ArrowLeft size={14} /> Move
            </button>
            <button type="button" className="secondary-action" onClick={() => onDeckMove(activeDeck, 1)} disabled={busy || decks.length < 2}>
              Move <ArrowRight size={14} />
            </button>
            <button type="button" className="primary-action" onClick={() => onDeckSave(activeDeck)} disabled={busy}>
              <Check size={14} /> Save deck
            </button>
          </div>
          <div className="deck-danger-row">
            <button type="button" onClick={onDeckCreate} disabled={busy}><Plus size={14} /> Add deck</button>
            <button type="button" className="danger-action" onClick={() => onDeckDelete(activeDeck)} disabled={busy}>
              <Trash2 size={14} /> Delete deck
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
