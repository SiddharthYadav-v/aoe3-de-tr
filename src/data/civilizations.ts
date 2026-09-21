import type { Civilization } from '../types'

const flagFiles: Record<string, string> = {
  american: 'Flag_American_act3_aoe3de.webp',
  aztec: 'Flag_AztecDE.webp',
  british: 'Flag_BritishDE.webp',
  chinese: 'Flag_ChineseDE.webp',
  danes: 'AoE3DE_Flag_Danes.webp',
  dutch: 'Flag_DutchDE.webp',
  ethiopian: 'Flag_Ethiopian_aoe3de.webp',
  french: 'Flag_FrenchDE.webp',
  german: 'Flag_GermanDE.webp',
  hausa: 'Flag_Hausa.webp',
  incan: 'Flag_IncanDE.webp',
  indian: 'Flag_IndianDE.webp',
  italian: 'Flag_ItalianDE.webp',
  iroquois: 'Flag_IroquoisDE.webp',
  japanese: 'Flag_JapaneseDE.webp',
  maltese: 'Flag_MalteseDE.webp',
  mexican: 'Flag_MexicanDE.webp',
  ottoman: 'Flag_OttomanDE.webp',
  polish: 'AoE3DE_Flag_Poles.webp',
  portuguese: 'Flag_PortugueseDE.webp',
  russian: 'Flag_RussianDE.webp',
  sioux: 'Flag_SiouxDE.webp',
  spanish: 'Flag_SpanishDE.webp',
  swedish: 'Flag_SwedishDE.webp',
}

const civilizationSeed: Omit<Civilization, 'flagPath' | 'profile'>[] = [
  { id: 'american', name: 'United States', shortName: 'US', region: 'Federal', accent: '#315d91', summary: 'Flexible federal age-ups and shipment-driven tempo.', strengths: ['Federal states', 'Militia', 'Shipment tempo'] },
  { id: 'aztec', name: 'Aztec', shortName: 'AZ', region: 'Native American', accent: '#a94e34', summary: 'Explosive infantry pressure backed by warrior priests.', strengths: ['Infantry mass', 'Warrior dance', 'Early pressure'] },
  { id: 'british', name: 'British', shortName: 'BR', region: 'European', accent: '#9e3d36', summary: 'A manor-fueled economy supporting durable armies.', strengths: ['Manor boom', 'Longbows', 'Musketeers'] },
  { id: 'chinese', name: 'Chinese', shortName: 'CH', region: 'Asian', accent: '#b34c38', summary: 'Banner armies and villages create broad strategic options.', strengths: ['Banner armies', 'Villages', 'Unit variety'] },
  { id: 'danes', name: 'Danes', shortName: 'DA', region: 'European', accent: '#9c443c', summary: 'A mobile Nordic roster with flexible economic tools.', strengths: ['Mobility', 'Mercenaries', 'Flexible economy'] },
  { id: 'dutch', name: 'Dutch', shortName: 'DU', region: 'European', accent: '#c57832', summary: 'Banks turn a compact economy into a strong midgame.', strengths: ['Banks', 'Skirmishers', 'Population efficiency'] },
  { id: 'ethiopian', name: 'Ethiopians', shortName: 'ET', region: 'African', accent: '#94723a', summary: 'Alliance age-ups and influence enable adaptive armies.', strengths: ['Influence', 'Mountain monasteries', 'Alliance units'] },
  { id: 'french', name: 'French', shortName: 'FR', region: 'European', accent: '#365f97', summary: 'Strong settlers and cavalry provide a resilient core.', strengths: ['Coureurs', 'Cuirassiers', 'Flexible tempo'] },
  { id: 'german', name: 'Germans', shortName: 'GE', region: 'European', accent: '#806547', summary: 'Free Uhlans and powerful shipments reward clean macro.', strengths: ['Uhlans', 'Settler wagons', 'Shipments'] },
  { id: 'hausa', name: 'Hausa', shortName: 'HA', region: 'African', accent: '#6e7041', summary: 'Influence, cattle, and alliances support tactical variety.', strengths: ['Cattle economy', 'Influence', 'Mixed armies'] },
  { id: 'incan', name: 'Inca', shortName: 'IN', region: 'Native American', accent: '#a66b32', summary: 'Map control and durable infantry anchor expansion.', strengths: ['Kancha houses', 'Strongholds', 'Infantry'] },
  { id: 'indian', name: 'Indians', shortName: 'ID', region: 'Asian', accent: '#a56239', summary: 'Villager shipments and specialized units scale smoothly.', strengths: ['Free villagers', 'Camels', 'Elephants'] },
  { id: 'italian', name: 'Italians', shortName: 'IT', region: 'European', accent: '#477254', summary: 'Architects and technology rewards enable greedy play.', strengths: ['Architects', 'Lombards', 'Technology boom'] },
  { id: 'iroquois', name: 'Haudenosaunee', shortName: 'HAU', region: 'Native American', accent: '#6d6041', summary: 'Fast age-ups and siege pressure create sharp timings.', strengths: ['Travois', 'Siege', 'Fast tempo'] },
  { id: 'japanese', name: 'Japanese', shortName: 'JA', region: 'Asian', accent: '#9a4742', summary: 'Shrines and upgrade-rich armies scale efficiently.', strengths: ['Shrines', 'Daimyo', 'Upgrades'] },
  { id: 'maltese', name: 'Maltese', shortName: 'MA', region: 'European', accent: '#a6463d', summary: 'Fixed defenses and specialists excel in prepared fights.', strengths: ['Fortifications', 'Fire throwers', 'Commanderies'] },
  { id: 'mexican', name: 'Mexico', shortName: 'MX', region: 'Federal', accent: '#557047', summary: 'Revolts and federal states unlock unusual power spikes.', strengths: ['Revolts', 'Haciendas', 'Federal states'] },
  { id: 'ottoman', name: 'Ottomans', shortName: 'OT', region: 'European', accent: '#477458', summary: 'Automatic villager production enables relentless tempo.', strengths: ['Free villagers', 'Artillery', 'Tempo'] },
  { id: 'polish', name: 'Poles', shortName: 'PL', region: 'European', accent: '#a54348', summary: 'A cavalry-forward roster built around decisive momentum.', strengths: ['Cavalry', 'Tempo', 'Map presence'] },
  { id: 'portuguese', name: 'Portuguese', shortName: 'PT', region: 'European', accent: '#4e7657', summary: 'Free town centers and range bonuses reward positioning.', strengths: ['Town centers', 'Range', 'Water maps'] },
  { id: 'russian', name: 'Russians', shortName: 'RU', region: 'European', accent: '#697a62', summary: 'Batch production floods the map with cost-efficient units.', strengths: ['Batch training', 'Map control', 'Attrition'] },
  { id: 'sioux', name: 'Lakota', shortName: 'LA', region: 'Native American', accent: '#8b633e', summary: 'Exceptional mobility punishes exposed armies and economies.', strengths: ['Cavalry', 'Mobility', 'Map control'] },
  { id: 'spanish', name: 'Spanish', shortName: 'SP', region: 'European', accent: '#a97835', summary: 'Fast shipments and a broad roster support crisp timings.', strengths: ['Shipments', 'Lancers', 'Flexible openings'] },
  { id: 'swedish', name: 'Swedes', shortName: 'SW', region: 'European', accent: '#426d8a', summary: 'Torps fuel a strong economy and mercenary transitions.', strengths: ['Torps', 'Caroleans', 'Mercenaries'] },
]

export const civilizations: Civilization[] = civilizationSeed.map((civilization) => ({
  ...civilization,
  flagPath: `/flags/${flagFiles[civilization.id]}?v=1`,
  profile: {
    playstyle: `${civilization.summary} Build the game plan around ${civilization.strengths
      .slice(0, 2)
      .join(' and ')
      .toLowerCase()}, then adapt the final composition to the map and opponent.`,
    economy: `${civilization.strengths[0]} is the economic anchor. Protect the infrastructure that enables it, keep villager production active, and spend each resource spike on a deliberate age-up, upgrade, or timing.`,
    military: `${civilization.strengths.slice(1).join(' and ')} define the army's strongest shape. Scout before committing, preserve the expensive core, and transition before the opponent's counter mass is complete.`,
    keyMechanics: civilization.strengths,
    boomingVideoId: null,
    decks: [
      {
        id: 'standard',
        title: 'Standard supremacy',
        description: 'A flexible one-versus-one deck for open maps and unknown opponents.',
        imagePath: null,
      },
      {
        id: 'boom',
        title: 'Economic boom',
        description: 'A greedier deck focused on scaling the civilization’s core economy.',
        imagePath: null,
      },
      {
        id: 'team',
        title: 'Team game',
        description: 'A team-oriented deck with stronger scaling and shared-map utility.',
        imagePath: null,
      },
    ],
  },
}))

export const civilizationById = Object.fromEntries(
  civilizations.map((civilization) => [civilization.id, civilization]),
)
