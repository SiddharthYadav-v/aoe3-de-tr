import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Images } from 'lucide-react'
import type { Civilization, DeckPreset } from '../types'

interface DeckCarouselProps {
  civilization: Civilization
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
            <small>Add an image path in civilizations.ts</small>
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

export function DeckCarousel({ civilization }: DeckCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStart = useRef<number | null>(null)
  const decks = civilization.profile.decks

  useEffect(() => setActiveIndex(0), [civilization.id])

  if (!decks.length) {
    return <div className="deck-empty">No decks have been added for {civilization.name} yet.</div>
  }

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + decks.length) % decks.length)
  }
  const previousIndex = (activeIndex - 1 + decks.length) % decks.length
  const nextIndex = (activeIndex + 1) % decks.length

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
          key={`${civilization.id}-${decks[activeIndex].id}-active`}
          deck={decks[activeIndex]}
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
    </div>
  )
}
