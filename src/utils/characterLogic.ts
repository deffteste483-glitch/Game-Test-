export type AdventurerAnimation =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'stand_up'
  | 'interact'
  | 'celebrate'
  | 'negative'
  | 'dance';

export type SkinToneId = 'ivory' | 'peach' | 'wheat' | 'amber' | 'sienna' | 'ebony';
export type HairStyleId = 'short_bard' | 'long_wavy' | 'traveler_bun' | 'braids' | 'mohawk' | 'bald';
export type HairColorId = 'oak_brown' | 'raven_black' | 'golden_blonde' | 'ember_red' | 'silver_elder' | 'royal_wine' | 'midnight_blue';
export type EyeColorId = 'dark_brown' | 'amber_gold' | 'forest_green' | 'glacial_blue' | 'mystic_violet';
export type ExpressionId = 'confident' | 'cheerful' | 'serene' | 'determined' | 'curious';
export type OutfitId = 'bard_tunic' | 'leather_jerkin' | 'scholar_robe' | 'troubadour_mail' | 'festive_vest';
export type CloakId = 'none' | 'wine_cloak' | 'wool_cape' | 'winter_coat' | 'royal_mantle';
export type HatId = 'none' | 'bard_beret' | 'ranger_hat' | 'pilgrim_hood' | 'gold_circlet' | 'bandana';
export type AccessoryId = 'none' | 'round_glasses' | 'brass_monocle' | 'cheek_scar' | 'bard_beard' | 'back_lute';

export interface AdventurerAppearance {
  adventurerName: string;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  eyeColor: EyeColorId;
  expression: ExpressionId;
  outfit: OutfitId;
  cloak: CloakId;
  hat: HatId;
  accessory: AccessoryId;
}

export interface OptionMeta<T extends string> {
  id: T;
  label: string;
  swatch?: string;
}

export const SKIN_TONE_OPTIONS: OptionMeta<SkinToneId>[] = [
  { id: 'ivory', label: 'Marfim Alvorada', swatch: '#f5cfb0' },
  { id: 'peach', label: 'Pêssego Quente', swatch: '#e3ab82' },
  { id: 'wheat', label: 'Trigo Dourado', swatch: '#d4956a' },
  { id: 'amber', label: 'Bronze Âmbar', swatch: '#b87648' },
  { id: 'sienna', label: 'Terra Queimada', swatch: '#8c5330' },
  { id: 'ebony', label: 'Ébano Profundo', swatch: '#59331d' },
];

export const HAIR_STYLE_OPTIONS: OptionMeta<HairStyleId>[] = [
  { id: 'short_bard', label: 'Curto de Bardo' },
  { id: 'long_wavy', label: 'Longo Ondulado' },
  { id: 'traveler_bun', label: 'Coque de Viajante' },
  { id: 'braids', label: 'Tranças Medievais' },
  { id: 'mohawk', label: 'Crista Trovadora' },
  { id: 'bald', label: 'Raspado / Calvo' },
];

export const HAIR_COLOR_OPTIONS: OptionMeta<HairColorId>[] = [
  { id: 'oak_brown', label: 'Castanho Carvalho', swatch: '#59341f' },
  { id: 'raven_black', label: 'Preto Corvo', swatch: '#1f1612' },
  { id: 'golden_blonde', label: 'Loiro Dourado', swatch: '#d9a441' },
  { id: 'ember_red', label: 'Ruivo Brasa', swatch: '#a83c23' },
  { id: 'silver_elder', label: 'Prata Ancião', swatch: '#c7c4bc' },
  { id: 'royal_wine', label: 'Vinho Real', swatch: '#6b1d2f' },
  { id: 'midnight_blue', label: 'Azul Noturno', swatch: '#283c5c' },
];

export const EYE_COLOR_OPTIONS: OptionMeta<EyeColorId>[] = [
  { id: 'dark_brown', label: 'Castanho Escuro', swatch: '#2b170b' },
  { id: 'amber_gold', label: 'Âmbar Dourado', swatch: '#c98a22' },
  { id: 'forest_green', label: 'Verde Floresta', swatch: '#2d6e40' },
  { id: 'glacial_blue', label: 'Azul Glacial', swatch: '#356c9c' },
  { id: 'mystic_violet', label: 'Violeta Místico', swatch: '#6f3882' },
];

export const EXPRESSION_OPTIONS: OptionMeta<ExpressionId>[] = [
  { id: 'confident', label: 'Confiante' },
  { id: 'cheerful', label: 'Alegre' },
  { id: 'serene', label: 'Sereno' },
  { id: 'determined', label: 'Determinado' },
  { id: 'curious', label: 'Curioso' },
];

export const OUTFIT_OPTIONS: OptionMeta<OutfitId>[] = [
  { id: 'bard_tunic', label: 'Túnica de Bardo (Vinho)', swatch: '#6b1d2f' },
  { id: 'leather_jerkin', label: 'Gibão de Couro Antigo', swatch: '#5e3a22' },
  { id: 'scholar_robe', label: 'Veste de Erudito (Musgo)', swatch: '#294a30' },
  { id: 'troubadour_mail', label: 'Cota de Trovador (Azul)', swatch: '#293e5c' },
  { id: 'festive_vest', label: 'Colete Festivo Dourado', swatch: '#9e6b1b' },
];

export const CLOAK_OPTIONS: OptionMeta<CloakId>[] = [
  { id: 'none', label: 'Sem Capa' },
  { id: 'wine_cloak', label: 'Manto de Viajante (Vinho)', swatch: '#591626' },
  { id: 'wool_cape', label: 'Capa de Lã com Fivela', swatch: '#4a3222' },
  { id: 'winter_coat', label: 'Casaco Longo da Noite', swatch: '#28201b' },
  { id: 'royal_mantle', label: 'Manto Real Bordado', swatch: '#8c6722' },
];

export const HAT_OPTIONS: OptionMeta<HatId>[] = [
  { id: 'none', label: 'Sem Chapéu' },
  { id: 'bard_beret', label: 'Boina com Pluma Dourada' },
  { id: 'ranger_hat', label: 'Chapéu de Aba Larga' },
  { id: 'pilgrim_hood', label: 'Capuz de Peregrino' },
  { id: 'gold_circlet', label: 'Tiara de Ouro Antigo' },
  { id: 'bandana', label: 'Bandana de Trovador' },
];

export const ACCESSORY_OPTIONS: OptionMeta<AccessoryId>[] = [
  { id: 'none', label: 'Nenhum Detalhe Extra' },
  { id: 'round_glasses', label: 'Óculos Redondos de Latão' },
  { id: 'brass_monocle', label: 'Monóculo Dourado' },
  { id: 'cheek_scar', label: 'Cicatriz de Aventureiro' },
  { id: 'bard_beard', label: 'Barba & Bigode de Bardo' },
  { id: 'back_lute', label: 'Alaúde nas Costas' },
];

export const ANIMATION_META: OptionMeta<AdventurerAnimation>[] = [
  { id: 'idle', label: 'Parado' },
  { id: 'walk', label: 'Caminhando' },
  { id: 'sit', label: 'Sentando' },
  { id: 'stand_up', label: 'Levantando' },
  { id: 'interact', label: 'Interagindo' },
  { id: 'celebrate', label: 'Comemorando' },
  { id: 'negative', label: 'Reagindo' },
  { id: 'dance', label: 'Dançando' },
];

export const DEFAULT_ADVENTURER: AdventurerAppearance = {
  adventurerName: 'Aldous, o Bardo',
  skinTone: 'peach',
  hairStyle: 'short_bard',
  hairColor: 'oak_brown',
  eyeColor: 'amber_gold',
  expression: 'confident',
  outfit: 'bard_tunic',
  cloak: 'wine_cloak',
  hat: 'bard_beret',
  accessory: 'back_lute',
};

export const SKIN_PALETTES: Record<SkinToneId, { shadow: string; base: string; light: string }> = {
  ivory: { shadow: '#d6a483', base: '#f5cfb0', light: '#fce3cd' },
  peach: { shadow: '#c78c63', base: '#e3ab82', light: '#f4c6a4' },
  wheat: { shadow: '#b0744b', base: '#d4956a', light: '#e8b28b' },
  amber: { shadow: '#8f552e', base: '#b87648', light: '#d19264' },
  sienna: { shadow: '#66381c', base: '#8c5330', light: '#a86b43' },
  ebony: { shadow: '#3b1f0f', base: '#59331d', light: '#75462b' },
};

export const HAIR_PALETTES: Record<HairColorId, { dark: string; mid: string; light: string }> = {
  oak_brown: { dark: '#3b2214', mid: '#59341f', light: '#7a492c' },
  raven_black: { dark: '#120c09', mid: '#1f1612', light: '#382a23' },
  golden_blonde: { dark: '#9e6f1b', mid: '#d9a441', light: '#f5ca6e' },
  ember_red: { dark: '#6e2110', mid: '#a83c23', light: '#d15a3b' },
  silver_elder: { dark: '#87837a', mid: '#c7c4bc', light: '#e8e6df' },
  royal_wine: { dark: '#420f1b', mid: '#6b1d2f', light: '#943147' },
  midnight_blue: { dark: '#172338', mid: '#283c5c', light: '#415d87' },
};

export const EYE_COLORS: Record<EyeColorId, string> = {
  dark_brown: '#24130b',
  amber_gold: '#b87614',
  forest_green: '#1e592f',
  glacial_blue: '#245882',
  mystic_violet: '#5a286b',
};

export const OUTFIT_PALETTES: Record<
  OutfitId,
  { dark: string; mid: string; light: string; trim: string; shirt: string }
> = {
  bard_tunic: {
    dark: '#4a121f',
    mid: '#6b1d2f',
    light: '#8c2b40',
    trim: '#d9a738',
    shirt: '#f4e7d1',
  },
  leather_jerkin: {
    dark: '#3b2313',
    mid: '#5e3a22',
    light: '#7d5033',
    trim: '#c59b27',
    shirt: '#e6d5b8',
  },
  scholar_robe: {
    dark: '#1a3320',
    mid: '#294a30',
    light: '#3d6946',
    trim: '#d9a738',
    shirt: '#f2e5ce',
  },
  troubadour_mail: {
    dark: '#1a293d',
    mid: '#293e5c',
    light: '#3e5a82',
    trim: '#d6d4ce',
    shirt: '#ebdfc8',
  },
  festive_vest: {
    dark: '#6e4710',
    mid: '#9e6b1b',
    light: '#c78c2c',
    trim: '#faf5e8',
    shirt: '#4a121f',
  },
};

export const CLOAK_PALETTES: Record<CloakId, { dark: string; mid: string; clasp: string }> = {
  none: { dark: 'transparent', mid: 'transparent', clasp: 'transparent' },
  wine_cloak: { dark: '#380b15', mid: '#591626', clasp: '#d9a738' },
  wool_cape: { dark: '#2e1e14', mid: '#4a3222', clasp: '#c59b27' },
  winter_coat: { dark: '#17120f', mid: '#28201b', clasp: '#b8b4aa' },
  royal_mantle: { dark: '#593e0e', mid: '#8c6722', clasp: '#f7d87c' },
};

function pickRandom<T extends string>(list: OptionMeta<T>[]): T {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx].id;
}

export function generateRandomAdventurer(baseName?: string): AdventurerAppearance {
  return {
    adventurerName: baseName?.trim() || 'Viajante das Cordas',
    skinTone: pickRandom(SKIN_TONE_OPTIONS),
    hairStyle: pickRandom(HAIR_STYLE_OPTIONS),
    hairColor: pickRandom(HAIR_COLOR_OPTIONS),
    eyeColor: pickRandom(EYE_COLOR_OPTIONS),
    expression: pickRandom(EXPRESSION_OPTIONS),
    outfit: pickRandom(OUTFIT_OPTIONS),
    cloak: pickRandom(CLOAK_OPTIONS),
    hat: pickRandom(HAT_OPTIONS),
    accessory: pickRandom(ACCESSORY_OPTIONS),
  };
}

export function sanitizeAdventurerAppearance(
  raw: Partial<AdventurerAppearance> | null | undefined,
  fallbackName = 'Viajante Musical'
): AdventurerAppearance {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ADVENTURER, adventurerName: fallbackName };
  }
  const validId = <T extends string>(val: unknown, opts: OptionMeta<T>[], def: T): T =>
    opts.some((o) => o.id === val) ? (val as T) : def;

  return {
    adventurerName:
      typeof raw.adventurerName === 'string' && raw.adventurerName.trim().length > 0
        ? raw.adventurerName.trim().slice(0, 28)
        : fallbackName,
    skinTone: validId(raw.skinTone, SKIN_TONE_OPTIONS, DEFAULT_ADVENTURER.skinTone),
    hairStyle: validId(raw.hairStyle, HAIR_STYLE_OPTIONS, DEFAULT_ADVENTURER.hairStyle),
    hairColor: validId(raw.hairColor, HAIR_COLOR_OPTIONS, DEFAULT_ADVENTURER.hairColor),
    eyeColor: validId(raw.eyeColor, EYE_COLOR_OPTIONS, DEFAULT_ADVENTURER.eyeColor),
    expression: validId(raw.expression, EXPRESSION_OPTIONS, DEFAULT_ADVENTURER.expression),
    outfit: validId(raw.outfit, OUTFIT_OPTIONS, DEFAULT_ADVENTURER.outfit),
    cloak: validId(raw.cloak, CLOAK_OPTIONS, DEFAULT_ADVENTURER.cloak),
    hat: validId(raw.hat, HAT_OPTIONS, DEFAULT_ADVENTURER.hat),
    accessory: validId(raw.accessory, ACCESSORY_OPTIONS, DEFAULT_ADVENTURER.accessory),
  };
}

export interface TavernHotspot {
  id: string;
  label: string;
  description: string;
  xPercent: number; // 12 to 88
  yPercent: number; // 58 to 86
  defaultAnimation: AdventurerAnimation;
  dialogue: string;
}

export const TAVERN_HOTSPOTS: TavernHotspot[] = [
  {
    id: 'lute_stage',
    label: 'Recanto do Alaúde',
    description: 'Acompanhe o ritmo da música medieval ou ensaie novos acordes.',
    xPercent: 18,
    yPercent: 74,
    defaultAnimation: 'dance',
    dialogue: 'As cordas do alaúde vibram em harmonia! Seu personagem acompanha o compasso da taverna.',
  },
  {
    id: 'hearth_stool',
    label: 'Banco da Lareira',
    description: 'Sente-se diante do fogo crepitante para descansar da viagem.',
    xPercent: 38,
    yPercent: 66,
    defaultAnimation: 'sit',
    dialogue: 'O calor da lareira de pedra aquece as botas de viagem enquanto a chuva cai lá fora.',
  },
  {
    id: 'barnaby_counter',
    label: 'Balcão de Barnaby',
    description: 'Cumprimente o anfitrião e erga um brinde às lendas da música.',
    xPercent: 62,
    yPercent: 66,
    defaultAnimation: 'celebrate',
    dialogue: 'Barnaby ergue sua caneca de madeira: “Saúde, aventureiro! Que noite memorável para uma canção!”',
  },
  {
    id: 'codex_shelf',
    label: 'Estante de Códices',
    description: 'Examine pergaminhos antigos e registros de artistas.',
    xPercent: 82,
    yPercent: 74,
    defaultAnimation: 'interact',
    dialogue: 'Você inspeciona os manuscritos musicais encadernados em couro envelhecido.',
  },
];

export function stepCharacterPosition(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  speedPerSec: number,
  dt: number
): { x: number; y: number; arrived: boolean; facing: 'left' | 'right' } {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const dist = Math.hypot(dx, dy);
  const facing: 'left' | 'right' = dx < -0.2 ? 'left' : 'right';

  if (dist <= 0.8) {
    return {
      x: Math.max(10, Math.min(90, targetX)),
      y: Math.max(58, Math.min(86, targetY)),
      arrived: true,
      facing,
    };
  }

  const step = Math.min(dist, speedPerSec * dt);
  const nx = Math.max(10, Math.min(90, currentX + (dx / dist) * step));
  const ny = Math.max(58, Math.min(86, currentY + (dy / dist) * step));

  return {
    x: nx,
    y: ny,
    arrived: step >= dist - 0.5,
    facing,
  };
}
