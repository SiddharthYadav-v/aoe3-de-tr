import { createClient, type Session } from '@supabase/supabase-js'
import { civilizationById } from '../data/civilizations'
import type { Civilization, MatchupGuide } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isCloudConfigured = Boolean(supabase)

export async function signInWithDiscord() {
  if (!supabase) return

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: window.location.origin },
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

export async function loadCloudGuides(): Promise<MatchupGuide[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('matchup_guides').select('*')
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    civilizationId: row.civilization_id,
    opponentId: row.opponent_id,
    overview: row.overview ?? '',
    gamePlan: row.game_plan ?? '',
    opening: row.opening ?? '',
    keyUnits: row.key_units ?? '',
    timings: row.timings ?? '',
    threats: row.threats ?? '',
    notes: row.notes ?? '',
    updatedAt: row.updated_at,
  }))
}

export async function loadCivilizations(): Promise<Civilization[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('civilizations')
    .select('id,name,short_name,region,accent,summary,strengths')
    .order('sort_order')
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    region: row.region as Civilization['region'],
    accent: row.accent,
    flagPath: civilizationById[row.id]?.flagPath ?? '',
    summary: row.summary,
    strengths: row.strengths,
  }))
}

export async function saveCloudGuide(guide: MatchupGuide) {
  if (!supabase) return guide
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
        updated_at: guide.updatedAt,
      },
      { onConflict: 'user_id,civilization_id,opponent_id' },
    )
    .select('id')
    .single()

  if (error) throw error
  return { ...guide, id: data.id }
}
