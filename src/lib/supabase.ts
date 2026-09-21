import { createClient, type Session } from '@supabase/supabase-js'
import { civilizationById, civilizations as seededCivilizations } from '../data/civilizations'
import type { Civilization, DeckPreset, MatchupGuide } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const DECK_BUCKET = 'deck-images'

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isCloudConfigured = Boolean(supabase)

export async function signInWithDiscord() {
  if (!supabase) return

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: window.location.href },
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function isCurrentUserGuideAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('guide_admins')
    .select('user_id')
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

function mapGuide(row: Record<string, unknown>): MatchupGuide {
  return {
    id: String(row.id),
    civilizationId: String(row.civilization_id),
    opponentId: String(row.opponent_id),
    overview: String(row.overview ?? ''),
    gamePlan: String(row.game_plan ?? ''),
    opening: String(row.opening ?? ''),
    keyUnits: String(row.key_units ?? ''),
    timings: String(row.timings ?? ''),
    threats: String(row.threats ?? ''),
    notes: String(row.notes ?? ''),
    updatedAt: String(row.updated_at),
  }
}

export async function loadPublicGuides(): Promise<MatchupGuide[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('matchup_guides').select('*')
  if (error) throw error
  return (data ?? []).map((row) => mapGuide(row))
}

function publicDeckUrl(path: string | null): string | null {
  if (!path || !supabase) return null
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path
  return supabase.storage.from(DECK_BUCKET).getPublicUrl(path).data.publicUrl
}

function mapDeck(row: Record<string, unknown>): DeckPreset {
  const storagePath = row.image_path ? String(row.image_path) : null
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ''),
    imagePath: publicDeckUrl(storagePath),
    storagePath,
    sortOrder: Number(row.sort_order ?? 0),
  }
}

export async function loadCivilizations(): Promise<Civilization[]> {
  if (!supabase) return seededCivilizations

  const [civilizationResult, deckResult] = await Promise.all([
    supabase
      .from('civilizations')
      .select('id,name,short_name,region,accent,summary,strengths,playstyle,economy,military,key_mechanics,booming_video_id')
      .order('sort_order'),
    supabase
      .from('civilization_decks')
      .select('id,civilization_id,slug,title,description,image_path,sort_order')
      .order('sort_order'),
  ])

  if (civilizationResult.error) throw civilizationResult.error
  if (deckResult.error) throw deckResult.error

  const decksByCivilization = new Map<string, DeckPreset[]>()
  for (const row of deckResult.data ?? []) {
    const current = decksByCivilization.get(row.civilization_id) ?? []
    current.push(mapDeck(row))
    decksByCivilization.set(row.civilization_id, current)
  }

  return (civilizationResult.data ?? [])
    .filter((row) => civilizationById[row.id])
    .map((row) => {
      const fallback = civilizationById[row.id]
      return {
        ...fallback,
        id: row.id,
        name: row.name,
        shortName: row.short_name,
        region: row.region as Civilization['region'],
        accent: row.accent,
        summary: row.summary,
        strengths: row.strengths,
        profile: {
          playstyle: row.playstyle || fallback.profile.playstyle,
          economy: row.economy || fallback.profile.economy,
          military: row.military || fallback.profile.military,
          keyMechanics: row.key_mechanics?.length
            ? row.key_mechanics
            : fallback.profile.keyMechanics,
          boomingVideoId: row.booming_video_id,
          decks: decksByCivilization.get(row.id) ?? fallback.profile.decks,
        },
      }
    })
}

export async function saveCivilization(civilization: Civilization): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('civilizations')
    .update({
      summary: civilization.summary,
      strengths: civilization.strengths,
      playstyle: civilization.profile.playstyle,
      economy: civilization.profile.economy,
      military: civilization.profile.military,
      key_mechanics: civilization.profile.keyMechanics,
      booming_video_id: civilization.profile.boomingVideoId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', civilization.id)
  if (error) throw error
}

export async function savePublicGuide(guide: MatchupGuide): Promise<MatchupGuide> {
  if (!supabase) throw new Error('Supabase is not configured')
  const updatedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from('matchup_guides')
    .upsert(
      {
        civilization_id: guide.civilizationId,
        opponent_id: guide.opponentId,
        overview: guide.overview,
        game_plan: guide.gamePlan,
        opening: guide.opening,
        key_units: guide.keyUnits,
        timings: guide.timings,
        threats: guide.threats,
        notes: guide.notes,
        updated_at: updatedAt,
      },
      { onConflict: 'civilization_id,opponent_id' },
    )
    .select('*')
    .single()
  if (error) throw error
  return mapGuide(data)
}

export async function createDeck(
  civilizationId: string,
  title: string,
): Promise<DeckPreset> {
  if (!supabase) throw new Error('Supabase is not configured')
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck'}-${Date.now().toString(36)}`
  const { data: existing, error: countError } = await supabase
    .from('civilization_decks')
    .select('sort_order')
    .eq('civilization_id', civilizationId)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (countError) throw countError

  const { data, error } = await supabase
    .from('civilization_decks')
    .insert({
      civilization_id: civilizationId,
      slug,
      title,
      description: '',
      sort_order: (existing?.[0]?.sort_order ?? 0) + 1,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapDeck(data)
}

export async function saveDeck(deck: DeckPreset): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('civilization_decks')
    .update({
      title: deck.title,
      description: deck.description,
      image_path: deck.storagePath,
      sort_order: deck.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deck.id)
  if (error) throw error
}

export async function deleteDeck(deck: DeckPreset): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('civilization_decks')
    .delete()
    .eq('id', deck.id)
  if (error) throw error
  if (deck.storagePath) await deleteDeckImage(deck.storagePath)
}

export async function uploadDeckImage(
  civilizationId: string,
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  if (!supabase) throw new Error('Supabase is not configured')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'webp'
  const path = `${civilizationId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(DECK_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return {
    path,
    publicUrl: supabase.storage.from(DECK_BUCKET).getPublicUrl(path).data.publicUrl,
  }
}

export async function deleteDeckImage(path: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.storage.from(DECK_BUCKET).remove([path])
  if (error) throw error
}
