import { AdventurerAnimation } from './characterLogic';

export const WORLD_WIDTH = 1152;
export const WORLD_HEIGHT = 576;
export const TILE_SIZE = 32;
export const GRID_COLS = Math.floor(WORLD_WIDTH / TILE_SIZE); // 36
export const GRID_ROWS = Math.floor(WORLD_HEIGHT / TILE_SIZE); // 18

export type Direction8 = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type SpriteFacing = 'left' | 'right';
export type SpriteVertical = 'front' | 'back';

export interface WorldObstacle {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Y coordinate used for painter's algorithm depth sorting */
  depthY: number;
  kind:
    | 'wall'
    | 'counter'
    | 'stage'
    | 'table_round'
    | 'table_rect'
    | 'hearth'
    | 'shelf'
    | 'notice_board'
    | 'pillar'
    | 'shop'
    | 'lectern';
}

export type InteractiveStationId =
  | 'counter_barnaby'
  | 'musical_stage'
  | 'tables_stools'
  | 'notice_board'
  | 'artist_shelf'
  | 'hearth_fireplace'
  | 'entrance_door'
  | 'collectible_book'
  | 'tavern_shop';

export interface TavernInteractiveStation {
  id: InteractiveStationId;
  title: string;
  shortPrompt: string;
  subtitle: string;
  /** Visual center of the object in world pixels */
  objectX: number;
  objectY: number;
  /** Exact walkable point where the adventurer stands/sits when interacting */
  interactX: number;
  interactY: number;
  /** Distance from (objectX, objectY) or (interactX, interactY) where proximity indicator appears */
  proximityRadius: number;
  /** Animation triggered upon arrival & interaction */
  interactionAnimation: AdventurerAnimation;
  facingOnInteract: SpriteFacing;
  dialogueLines: string[];
  actionLabel: string;
}

export interface TavernSeatStool {
  id: string;
  label: string;
  tableName: string;
  x: number;
  y: number;
  facing: SpriteFacing;
}

export type NpcRole = 'bartender' | 'musician' | 'patron' | 'server';

export type NpcActivity =
  | 'polishing_mug'
  | 'pouring_mead'
  | 'checking_ledger'
  | 'playing_lute'
  | 'harmonic_flourish'
  | 'tuning_strings'
  | 'holding_mug'
  | 'sipping_drink'
  | 'talking'
  | 'reading_scroll'
  | 'tapping_table'
  | 'clapping_rhythm'
  | 'walking_hall'
  | 'serving_drinks'
  | 'greeting_player';

export interface NpcPatrolStop {
  x: number;
  y: number;
  pauseSec: number;
  facingAtStop: SpriteFacing;
  activityAtStop: NpcActivity;
}

export interface TavernNpc {
  id: string;
  name: string;
  title: string;
  role: NpcRole;
  x: number;
  y: number;
  depthY: number;
  facing: SpriteFacing;
  phaseOffset: number;
  tunicColor: string;
  accentColor: string;
  hairColor: string;
  skinColor: string;
  hatType?: 'beret' | 'hood' | 'circlet' | 'bandana' | 'none';
  isSeated?: boolean;
  patrolRoute?: NpcPatrolStop[];
  walkSpeed?: number;
  activities: NpcActivity[];
  ambientLines: string[];
  greetingLine: string;
}

export interface NpcRuntimeState {
  npc: TavernNpc;
  x: number;
  y: number;
  depthY: number;
  facing: SpriteFacing;
  isWalking: boolean;
  walkStep: number;
  activity: NpcActivity;
  isPlayerNear: boolean;
  isBlinking: boolean;
  breathOffset: number;
  activeSpeech: string | null;
}

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir8: Direction8;
  facing: SpriteFacing;
  vertical: SpriteVertical;
  isMoving: boolean;
}

export interface Waypoint {
  x: number;
  y: number;
}

/**
 * Collidable furniture & architecture in the 1152x576 3/4-perspective tavern hall.
 * North wall occupies y: 0..128. Perimeter walls frame the room.
 */
export const TAVERN_OBSTACLES: WorldObstacle[] = [
  // Perimeter Walls
  {
    id: 'wall_north',
    label: 'Parede Norte de Pedra',
    x: 0,
    y: 0,
    width: WORLD_WIDTH,
    height: 128,
    depthY: 128,
    kind: 'wall',
  },
  {
    id: 'wall_west',
    label: 'Parede Oeste',
    x: 0,
    y: 0,
    width: 48,
    height: WORLD_HEIGHT,
    depthY: WORLD_HEIGHT,
    kind: 'wall',
  },
  {
    id: 'wall_east',
    label: 'Parede Leste',
    x: WORLD_WIDTH - 48,
    y: 0,
    width: 48,
    height: WORLD_HEIGHT,
    depthY: WORLD_HEIGHT,
    kind: 'wall',
  },
  {
    id: 'wall_south_left',
    label: 'Parede Sul Esquerda',
    x: 0,
    y: WORLD_HEIGHT - 40,
    width: 460,
    height: 40,
    depthY: WORLD_HEIGHT,
    kind: 'wall',
  },
  {
    id: 'wall_south_right',
    label: 'Parede Sul Direita',
    x: 692,
    y: WORLD_HEIGHT - 40,
    width: 460,
    height: 40,
    depthY: WORLD_HEIGHT,
    kind: 'wall',
  },

  // 1. Artist Codex Bookshelf (North-West Wall)
  {
    id: 'prop_artist_shelf',
    label: 'Estante Musical de Artistas',
    x: 92,
    y: 96,
    width: 156,
    height: 64,
    depthY: 160,
    kind: 'shelf',
  },

  // 2. Stone Hearth & Fireplace (North-Center-Left Wall)
  {
    id: 'prop_hearth',
    label: 'Lareira de Pedra',
    x: 296,
    y: 88,
    width: 176,
    height: 74,
    depthY: 162,
    kind: 'hearth',
  },

  // 3. Barnaby's Oak Counter & Bar (North-Center-Right)
  {
    id: 'prop_counter',
    label: 'Balcão de Barnaby',
    x: 520,
    y: 154,
    width: 256,
    height: 74,
    depthY: 228,
    kind: 'counter',
  },

  // 4. Musical Stage Raised Platform Edge (East / North-East)
  {
    id: 'prop_stage_instruments',
    label: 'Atril e Instrumentos do Palco',
    x: 876,
    y: 150,
    width: 196,
    height: 74,
    depthY: 224,
    kind: 'stage',
  },

  // 5. Notice Board on West Wall
  {
    id: 'prop_notice_board',
    label: 'Mural de Avisos',
    x: 48,
    y: 256,
    width: 52,
    height: 88,
    depthY: 344,
    kind: 'notice_board',
  },

  // 6. Central & Side Tavern Tables with Stools
  {
    id: 'table_west_round',
    label: 'Mesa dos Trovadores',
    x: 220,
    y: 344,
    width: 124,
    height: 80,
    depthY: 424,
    kind: 'table_round',
  },
  {
    id: 'table_center_banquet',
    label: 'Mesa Principal das Banquetas',
    x: 476,
    y: 356,
    width: 200,
    height: 86,
    depthY: 442,
    kind: 'table_rect',
  },
  {
    id: 'table_east_round',
    label: 'Mesa do Alaúde Dourado',
    x: 816,
    y: 348,
    width: 124,
    height: 80,
    depthY: 428,
    kind: 'table_round',
  },

  // 7. Merchant Stall / Tavern Shop Alcove (South-East Corner - Prepared Visual Space)
  {
    id: 'prop_shop_stall',
    label: 'Empório Musical (Espaço Preparado)',
    x: 998,
    y: 432,
    width: 96,
    height: 64,
    depthY: 496,
    kind: 'shop',
  },

  // Decorative Wooden Support Pillars
  {
    id: 'pillar_left',
    label: 'Pilar de Carvalho Oeste',
    x: 256,
    y: 252,
    width: 34,
    height: 36,
    depthY: 288,
    kind: 'pillar',
  },
  {
    id: 'pillar_right',
    label: 'Pilar de Carvalho Leste',
    x: 804,
    y: 252,
    width: 34,
    height: 36,
    depthY: 288,
    kind: 'pillar',
  },
];

/**
 * Interactive Stools around the Tavern Tables where the player can sit directly.
 */
export const TAVERN_SEAT_STOOLS: TavernSeatStool[] = [
  {
    id: 'stool_west_south',
    label: 'Banqueta da Mesa dos Trovadores',
    tableName: 'Mesa dos Trovadores (Oeste)',
    x: 282,
    y: 440,
    facing: 'right',
  },
  {
    id: 'stool_center_west',
    label: 'Banqueta Oeste do Salão',
    tableName: 'Mesa Principal das Partidas',
    x: 536,
    y: 460,
    facing: 'right',
  },
  {
    id: 'stool_center_east',
    label: 'Banqueta Leste do Salão',
    tableName: 'Mesa Principal das Partidas',
    x: 616,
    y: 460,
    facing: 'left',
  },
  {
    id: 'stool_east_south',
    label: 'Banqueta do Alaúde Dourado',
    tableName: 'Mesa do Alaúde Dourado (Leste)',
    x: 878,
    y: 444,
    facing: 'left',
  },
];

/**
 * Living Stardew Valley-inspired Pixel-Art NPCs inhabiting the Musical Tavern Hall.
 * Includes stationary behind-counter bartender, stage musician, seated patrons,
 * AND strolling tavern characters walking naturally through the room.
 */
export const TAVERN_NPCS: TavernNpc[] = [
  {
    id: 'npc_barnaby',
    name: 'Barnaby',
    title: 'Mestre Taverneiro & Guardião do Livro',
    role: 'bartender',
    x: 648,
    y: 168,
    depthY: 192,
    facing: 'left',
    phaseOffset: 0.0,
    tunicColor: '#6d4c41',
    accentColor: '#d9a738',
    hairColor: '#4e342e',
    skinColor: '#f5cfa8',
    hatType: 'none',
    activities: ['polishing_mug', 'pouring_mead', 'checking_ledger'],
    ambientLines: [
      'Limpando as canecas de carvalho...',
      'O hidromel está na temperatura perfeita!',
      'Conferindo os selos do Livro de Visitantes.',
    ],
    greetingLine: '“Bem-vindo ao balcão! Consulte seu perfil, áudio ou peça um brinde!”',
  },
  {
    id: 'npc_lirael',
    name: 'Lirael',
    title: 'Trovador Residente do Palco',
    role: 'musician',
    x: 912,
    y: 204,
    depthY: 218,
    facing: 'left',
    phaseOffset: 1.7,
    tunicColor: '#6b1d2f',
    accentColor: '#f7d87c',
    hairColor: '#2b180e',
    skinColor: '#e6b891',
    hatType: 'beret',
    activities: ['playing_lute', 'harmonic_flourish', 'tuning_strings'],
    ambientLines: [
      '♪ Dedilhando prelúdio em Ré Dórico...',
      '♪ Harmônicos de alaúde ecoam pelo salão...',
      'Afinando a sexta corda para o desafio...',
    ],
    greetingLine: '“Que bom vê-lo perto do palco! Suba para ensaiar um Ritmo Harmônico!”',
  },
  {
    id: 'npc_garrick',
    name: 'Sir Garrick',
    title: 'Veterano das Baladas Épicas',
    role: 'patron',
    x: 202,
    y: 382,
    depthY: 422,
    facing: 'right',
    phaseOffset: 3.1,
    tunicColor: '#294a30',
    accentColor: '#c59b27',
    hairColor: '#5d4037',
    skinColor: '#f0c299',
    hatType: 'bandana',
    isSeated: true,
    activities: ['holding_mug', 'sipping_drink', 'talking'],
    ambientLines: [
      '“Nada supera um solo acústico perto da lareira!”',
      'Brindando à noite chuvosa...',
      '“Ouvi dizer que novos códices chegaram à estante.”',
    ],
    greetingLine: '“Saúde, aventureiro! Sente-se conosco na Mesa dos Trovadores!”',
  },
  {
    id: 'npc_mirela',
    name: 'Cronista Mirela',
    title: 'Estudiosa de Partituras Antigas',
    role: 'patron',
    x: 358,
    y: 382,
    depthY: 422,
    facing: 'left',
    phaseOffset: 4.8,
    tunicColor: '#293e5c',
    accentColor: '#f7d87c',
    hairColor: '#1b0f0a',
    skinColor: '#dba379',
    hatType: 'circlet',
    isSeated: true,
    activities: ['reading_scroll', 'talking', 'holding_mug'],
    ambientLines: [
      'Anotando cadências no pergaminho...',
      '“A coleção de cartas no atril é fascinante.”',
      'Conversando sobre lendas da música...',
    ],
    greetingLine: '“Olá! Já leu os pergaminhos pregados no Mural de Avisos?”',
  },
  {
    id: 'npc_thom',
    name: 'Bardo Thom',
    title: 'Viajante das Cordas do Norte',
    role: 'patron',
    x: 458,
    y: 398,
    depthY: 440,
    facing: 'right',
    phaseOffset: 6.2,
    tunicColor: '#5c361e',
    accentColor: '#d9a738',
    hairColor: '#8d6e63',
    skinColor: '#f5cfa8',
    hatType: 'hood',
    isSeated: true,
    activities: ['tapping_table', 'holding_mug', 'talking'],
    ambientLines: [
      'Marcando o compasso 3/4 na mesa...',
      '“Em breve teremos partidas musicais aqui!”',
      'Apreciando o calor do salão...',
    ],
    greetingLine: '“Puxe uma banqueta! Esta mesa é o coração das partidas musicais!”',
  },
  {
    id: 'npc_freya',
    name: 'Artífice Freya',
    title: 'Luthier de Alaúdes & Harpas',
    role: 'patron',
    x: 954,
    y: 386,
    depthY: 426,
    facing: 'left',
    phaseOffset: 8.4,
    tunicColor: '#4a121f',
    accentColor: '#e8833a',
    hairColor: '#b85d19',
    skinColor: '#f4c6a4',
    hatType: 'none',
    isSeated: true,
    activities: ['clapping_rhythm', 'sipping_drink', 'talking'],
    ambientLines: [
      'Acompanhando a melodia de Lirael...',
      '“A madeira deste salão tem acústica perfeita!”',
      'Observando o Empório Musical ao sul...',
    ],
    greetingLine: '“Ouça só esse alaúde! O palco está radiante hoje!”',
  },
  {
    id: 'npc_elena',
    name: 'Elena',
    title: 'Anfitriã & Mensageira do Salão',
    role: 'server',
    x: 706,
    y: 288,
    depthY: 288,
    facing: 'left',
    phaseOffset: 2.4,
    tunicColor: '#7a283b',
    accentColor: '#f5deb3',
    hairColor: '#c87d32',
    skinColor: '#f7d2b0',
    hatType: 'circlet',
    isSeated: false,
    walkSpeed: 62,
    patrolRoute: [
      {
        x: 748,
        y: 286,
        pauseSec: 1.8,
        facingAtStop: 'left',
        activityAtStop: 'serving_drinks',
      },
      {
        x: 738,
        y: 344,
        pauseSec: 1.8,
        facingAtStop: 'left',
        activityAtStop: 'talking',
      },
      {
        x: 392,
        y: 320,
        pauseSec: 2.0,
        facingAtStop: 'left',
        activityAtStop: 'serving_drinks',
      },
      {
        x: 372,
        y: 248,
        pauseSec: 1.8,
        facingAtStop: 'right',
        activityAtStop: 'clapping_rhythm',
      },
    ],
    activities: ['serving_drinks', 'talking', 'clapping_rhythm'],
    ambientLines: [
      'Trazendo hidromel morno com especiarias...',
      '“Que noite acolhedora na Musical Tavern!”',
      'Recolhendo pedidos das mesas dos bardos...',
    ],
    greetingLine: '“Seja muito bem-vindo! Fique à vontade para explorar todo o salão!”',
  },
];

/**
 * Computes the deterministic position, walking state, and expressive animation of an NPC at time elapsedSec.
 */
export function getNpcRuntimeState(
  npc: TavernNpc,
  elapsedSec: number,
  playerX: number,
  playerY: number
): NpcRuntimeState {
  let curX = npc.x;
  let curY = npc.y;
  let curFacing: SpriteFacing = npc.facing;
  let isWalking = false;
  let walkStep = 0;
  let patrolActivity: NpcActivity | null = null;

  // Handle strolling patrol route if configured
  if (npc.patrolRoute && npc.patrolRoute.length > 1) {
    const route = npc.patrolRoute;
    const speed = npc.walkSpeed || 50;
    const segments: {
      from: NpcPatrolStop;
      to: NpcPatrolStop;
      walkDur: number;
      pauseDur: number;
    }[] = [];
    let totalCycle = 0;

    for (let i = 0; i < route.length; i++) {
      const from = route[i];
      const to = route[(i + 1) % route.length];
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const walkDur = dist / speed;
      const pauseDur = from.pauseSec;
      segments.push({ from, to, walkDur, pauseDur });
      totalCycle += pauseDur + walkDur;
    }

    let tCycle = (elapsedSec + npc.phaseOffset * 2.5) % totalCycle;
    for (const seg of segments) {
      if (tCycle <= seg.pauseDur) {
        curX = seg.from.x;
        curY = seg.from.y;
        curFacing = seg.from.facingAtStop;
        isWalking = false;
        patrolActivity = seg.from.activityAtStop;
        break;
      }
      tCycle -= seg.pauseDur;
      if (tCycle <= seg.walkDur) {
        const ratio = tCycle / Math.max(0.01, seg.walkDur);
        curX = seg.from.x + (seg.to.x - seg.from.x) * ratio;
        curY = seg.from.y + (seg.to.y - seg.from.y) * ratio;
        curFacing = seg.to.x < seg.from.x ? 'left' : 'right';
        isWalking = true;
        walkStep = Math.floor(elapsedSec * 7.0) % 4;
        patrolActivity = 'walking_hall';
        break;
      }
      tCycle -= seg.walkDur;
    }
  }

  const dist = Math.hypot(playerX - curX, playerY - curY);
  const isPlayerNear = dist <= 120;

  if (isPlayerNear) {
    curFacing = playerX < curX ? 'left' : 'right';
  }

  const localTime = elapsedSec + npc.phaseOffset;
  const cycleIndex = Math.floor(localTime / 4.5) % npc.activities.length;
  const activity: NpcActivity = isPlayerNear
    ? 'greeting_player'
    : patrolActivity || npc.activities[cycleIndex];

  // Blinking happens briefly every ~3.8 seconds out of phase per NPC
  const blinkPhase = (localTime * 1.1) % 3.8;
  const isBlinking = blinkPhase > 3.62;

  // Breathing bob (0 or 1 pixel) out of phase per NPC
  const breathOffset = isWalking
    ? walkStep % 2 === 1
      ? -1
      : 0
    : Math.sin(localTime * 2.8) > 0.25
    ? 1
    : 0;

  // Speech bubble appears when player is near OR occasionally during ambient cycle,
  // unless the NPC is walking right across the player's torso
  const occludesPlayer =
    npc.patrolRoute &&
    Math.abs(playerX - curX) < 95 &&
    Math.abs(playerY - curY) < 75;
  const ambientBubbleWindow = (localTime % 9.5) < 3.1;
  const ambientLine =
    npc.ambientLines[Math.floor(localTime / 9.5) % npc.ambientLines.length];

  const activeSpeech = occludesPlayer
    ? null
    : isPlayerNear
    ? npc.greetingLine
    : ambientBubbleWindow
    ? ambientLine
    : null;

  const computedDepthY = npc.patrolRoute ? Math.round(curY) : npc.depthY;

  return {
    npc,
    x: curX,
    y: curY,
    depthY: computedDepthY,
    facing: curFacing,
    isWalking,
    walkStep,
    activity,
    isPlayerNear,
    isBlinking,
    breathOffset,
    activeSpeech,
  };
}

/**
 * All Interactive Points in the Tavern Hall (including the original 7 stations +
 * Collectible Card Book & Prepared Merchant Shop Space).
 */
export const TAVERN_INTERACTIVE_STATIONS: TavernInteractiveStation[] = [
  {
    id: 'counter_barnaby',
    title: 'Balcão & Bartender Barnaby',
    shortPrompt: 'Balcão & Perfil',
    subtitle:
      'Acesse seu Perfil de Aventureiro, Configurações de Áudio e converse com Barnaby.',
    objectX: 656,
    objectY: 186,
    interactX: 656,
    interactY: 268,
    proximityRadius: 105,
    interactionAnimation: 'celebrate',
    facingOnInteract: 'right',
    dialogueLines: [
      '“Bem-vindo ao balcão principal! Aqui você consulta seu Perfil de Aventureiro, ajusta a Acústica da Taverna ou brinda conosco.”',
      '“Sua presença ilumina nosso salão! Veja os detalhes do seu registro abaixo.”',
    ],
    actionLabel: 'Abrir Balcão & Perfil',
  },
  {
    id: 'collectible_book',
    title: 'Livro de Colecionáveis & Cartas',
    shortPrompt: 'Livro de Colecionáveis',
    subtitle:
      'Consulte o grimório de cartas colecionáveis e a estrutura por artista, banda e raridade.',
    objectX: 544,
    objectY: 186,
    interactX: 544,
    interactY: 268,
    proximityRadius: 95,
    interactionAnimation: 'interact',
    facingOnInteract: 'left',
    dialogueLines: [
      'Sobre o atril de couro repousa o Livro de Colecionáveis da Musical Tavern.',
      'Aqui ficam catalogadas as insígnias e cartas musicais organizadas por Artista, Banda e Raridade.',
    ],
    actionLabel: 'Abrir Livro de Colecionáveis',
  },
  {
    id: 'musical_stage',
    title: 'Palco Musical & Desafios',
    shortPrompt: 'Palco Musical',
    subtitle:
      'Área destinada a performances, eventos especiais e desafios musicais com o Bardo Lirael.',
    objectX: 974,
    objectY: 196,
    interactX: 960,
    interactY: 264,
    proximityRadius: 115,
    interactionAnimation: 'dance',
    facingOnInteract: 'left',
    dialogueLines: [
      'Você sobe ao tablado iluminado do Palco Musical ao lado do trovador Lirael.',
      'Este espaço recebe os Eventos Musicais, ensaios de Ritmo Harmônico e futuras Partidas Especiais da taverna!',
    ],
    actionLabel: 'Subir ao Palco',
  },
  {
    id: 'tables_stools',
    title: 'Mesas de Partidas Musicais',
    shortPrompt: 'Mesas & Partidas',
    subtitle:
      'Sente-se nas banquetas, converse com os frequentadores e veja os espaços de partidas musicais.',
    objectX: 576,
    objectY: 396,
    interactX: 576,
    interactY: 462,
    proximityRadius: 110,
    interactionAnimation: 'sit',
    facingOnInteract: 'right',
    dialogueLines: [
      'Você se aproxima das mesas de carvalho onde os bardos se reúnem para desafios e duelos musicais.',
      'Escolha uma banqueta para sentar-se ou consulte as Mesas de Desafios (Salas Públicas e Privadas em preparação).',
    ],
    actionLabel: 'Sentar & Ver Mesas',
  },
  {
    id: 'notice_board',
    title: 'Mural de Avisos, Missões & Conquistas',
    shortPrompt: 'Mural de Avisos',
    subtitle:
      'Pergaminhos estendidos com missões, desafios, conquistas, comunicados e notas de bardos.',
    objectX: 76,
    objectY: 298,
    interactX: 138,
    interactY: 304,
    proximityRadius: 105,
    interactionAnimation: 'interact',
    facingOnInteract: 'left',
    dialogueLines: [
      'EDITAL REAL DOS BARDOS: “Confira as Missões, Desafios, Conquistas e Comunicados pregados na madeira.”',
      'Desenrole qualquer pergaminho para lê-lo na íntegra ou pregue sua própria nota no mural!',
    ],
    actionLabel: 'Abrir Mural de Avisos',
  },
  {
    id: 'artist_shelf',
    title: 'Estante Musical — Enciclopédia de Artistas',
    shortPrompt: 'Estante de Artistas',
    subtitle:
      'Enciclopédia ilustrada de artistas e bandas com biografias, fotografias reais e pixel art 16-bit.',
    objectX: 170,
    objectY: 88,
    interactX: 170,
    interactY: 222,
    proximityRadius: 110,
    interactionAnimation: 'interact',
    facingOnInteract: 'left',
    dialogueLines: [
      'Você abre os tomos encadernados em couro da Estante Musical.',
      'Explore biografias de artistas e bandas com sua dupla representação: fotografia real histórica e miniatura em pixel art 16-bit.',
    ],
    actionLabel: 'Consultar Enciclopédia',
  },
  {
    id: 'hearth_fireplace',
    title: 'Lareira de Pedra Acesa',
    shortPrompt: 'Lareira Acesa',
    subtitle: 'Sinta o calor das chamas âmbar, a fumaça suave e o crepitar da lenha.',
    objectX: 384,
    objectY: 84,
    interactX: 384,
    interactY: 226,
    proximityRadius: 115,
    interactionAnimation: 'sit',
    facingOnInteract: 'left',
    dialogueLines: [
      'As chamas dançam sobre as pedras antigas, espalhando reflexos dourados pelo piso de madeira.',
      'Suas mãos e botas se aquecem enquanto a chuva cai suavemente lá fora.',
    ],
    actionLabel: 'Aquecer-se junto ao Fogo',
  },
  {
    id: 'tavern_shop',
    title: 'Empório Musical da Taverna',
    shortPrompt: 'Loja (Em Breve)',
    subtitle:
      'Alcova preparada visualmente para futuras relíquias, instrumentos e adornos da taverna.',
    objectX: 1036,
    objectY: 454,
    interactX: 966,
    interactY: 462,
    proximityRadius: 105,
    interactionAnimation: 'interact',
    facingOnInteract: 'right',
    dialogueLines: [
      'O balcão de veludo carmesim do Empório Musical exibe estojos de alaúde, molduras douradas e baús entalhados.',
      'O mercador está organizando o estoque para as próximas etapas da Musical Tavern!',
    ],
    actionLabel: 'Inspecionar Empório',
  },
  {
    id: 'entrance_door',
    title: 'Porta de Entrada da Taverna',
    shortPrompt: 'Porta de Entrada',
    subtitle: 'Portas duplas de carvalho e ferro que guardam a entrada da Musical Tavern.',
    objectX: 576,
    objectY: 536,
    interactX: 576,
    interactY: 504,
    proximityRadius: 105,
    interactionAnimation: 'interact',
    facingOnInteract: 'left',
    dialogueLines: [
      'Pela fresta da pesada porta de carvalho, você vê a noite chuvosa lá fora.',
      'Deseja consultar novamente sua página de Assinatura no Livro de Visitantes ou continuar explorando o salão?',
    ],
    actionLabel: 'Ver Livro de Entrada',
  },
];

export const INITIAL_PLAYER_STATE: PlayerPhysicsState = {
  x: 576,
  y: 296,
  vx: 0,
  vy: 0,
  dir8: 'S',
  facing: 'right',
  vertical: 'front',
  isMoving: false,
};

const PLAYER_COLLISION_RADIUS = 14;
const MAX_SPEED = 240; // px per second
const ACCELERATION = 1400; // px per second^2
const DECELERATION = 1200; // px per second^2

/**
 * Computes 8-directional compass orientation from velocity or input vector.
 */
export function vectorToDirection8(
  dx: number,
  dy: number,
  fallback: Direction8 = 'S'
): Direction8 {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return 'E';
  if (angle >= 22.5 && angle < 67.5) return 'SE';
  if (angle >= 67.5 && angle < 112.5) return 'S';
  if (angle >= 112.5 && angle < 157.5) return 'SW';
  if (angle >= 157.5 || angle < -157.5) return 'W';
  if (angle >= -157.5 && angle < -112.5) return 'NW';
  if (angle >= -112.5 && angle < -67.5) return 'N';
  return 'NE';
}

/**
 * Checks if a circle at (cx, cy) with radius r intersects an AABB obstacle.
 */
export function circleIntersectsAABB(
  cx: number,
  cy: number,
  r: number,
  obs: WorldObstacle
): boolean {
  const closestX = Math.max(obs.x, Math.min(cx, obs.x + obs.width));
  const closestY = Math.max(obs.y, Math.min(cy, obs.y + obs.height));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

/**
 * Checks if a world coordinate (x, y) is walkable (no collision with any obstacle).
 */
export function isWorldPointWalkable(
  x: number,
  y: number,
  obstacles: WorldObstacle[] = TAVERN_OBSTACLES,
  radius = PLAYER_COLLISION_RADIUS
): boolean {
  if (
    x < 48 + radius ||
    x > WORLD_WIDTH - 48 - radius ||
    y < 128 + radius ||
    y > WORLD_HEIGHT - 40 - radius
  ) {
    return false;
  }
  for (const obs of obstacles) {
    if (circleIntersectsAABB(x, y, radius, obs)) {
      return false;
    }
  }
  return true;
}

/**
 * Resolves position with independent X and Y axis sliding against all obstacles.
 */
export function resolveSlidingCollision(
  oldX: number,
  oldY: number,
  targetX: number,
  targetY: number,
  obstacles: WorldObstacle[] = TAVERN_OBSTACLES,
  radius = PLAYER_COLLISION_RADIUS
): { x: number; y: number; collidedX: boolean; collidedY: boolean } {
  const minX = 48 + radius;
  const maxX = WORLD_WIDTH - 48 - radius;
  const minY = 128 + radius;
  const maxY = WORLD_HEIGHT - 40 - radius;

  let nextX = Math.max(minX, Math.min(maxX, targetX));
  let nextY = oldY;
  let collidedX = false;
  let collidedY = false;

  for (const obs of obstacles) {
    if (circleIntersectsAABB(nextX, nextY, radius, obs)) {
      nextX = oldX;
      collidedX = true;
      break;
    }
  }

  nextY = Math.max(minY, Math.min(maxY, targetY));
  for (const obs of obstacles) {
    if (circleIntersectsAABB(nextX, nextY, radius, obs)) {
      nextY = oldY;
      collidedY = true;
      break;
    }
  }

  return { x: nextX, y: nextY, collidedX, collidedY };
}

/**
 * Steps 8-directional free movement with natural acceleration, deceleration,
 * direction updates, and smooth wall/furniture collision sliding.
 */
export function stepFreeMovementPhysics(
  state: PlayerPhysicsState,
  inputX: number,
  inputY: number,
  obstacles: WorldObstacle[] = TAVERN_OBSTACLES,
  dt: number
): PlayerPhysicsState {
  const clampedDt = Math.min(0.1, Math.max(0.001, dt));
  const mag = Math.hypot(inputX, inputY);
  const hasInput = mag > 0.05;

  let normX = 0;
  let normY = 0;
  if (hasInput) {
    const scale = Math.min(1, mag) / mag;
    normX = inputX * scale;
    normY = inputY * scale;
  }

  let vx = state.vx;
  let vy = state.vy;

  if (hasInput) {
    const targetVx = normX * MAX_SPEED;
    const targetVy = normY * MAX_SPEED;
    const dvx = targetVx - vx;
    const dvy = targetVy - vy;
    const maxStep = ACCELERATION * clampedDt;
    const distV = Math.hypot(dvx, dvy);
    if (distV <= maxStep) {
      vx = targetVx;
      vy = targetVy;
    } else {
      vx += (dvx / distV) * maxStep;
      vy += (dvy / distV) * maxStep;
    }
  } else {
    const speed = Math.hypot(vx, vy);
    const drop = DECELERATION * clampedDt;
    if (speed <= drop) {
      vx = 0;
      vy = 0;
    } else {
      const ratio = (speed - drop) / speed;
      vx *= ratio;
      vy *= ratio;
    }
  }

  const speedNow = Math.hypot(vx, vy);
  const isMoving = speedNow > 6;

  const rawX = state.x + vx * clampedDt;
  const rawY = state.y + vy * clampedDt;

  const resolved = resolveSlidingCollision(state.x, state.y, rawX, rawY, obstacles);
  if (resolved.collidedX) vx = 0;
  if (resolved.collidedY) vy = 0;

  const dir8 = hasInput
    ? vectorToDirection8(normX, normY, state.dir8)
    : isMoving
    ? vectorToDirection8(vx, vy, state.dir8)
    : state.dir8;

  const facing: SpriteFacing =
    normX < -0.1
      ? 'left'
      : normX > 0.1
      ? 'right'
      : vx < -5
      ? 'left'
      : vx > 5
      ? 'right'
      : state.facing;

  const vertical: SpriteVertical =
    dir8 === 'N' || dir8 === 'NW' || dir8 === 'NE' ? 'back' : 'front';

  return {
    x: resolved.x,
    y: resolved.y,
    vx,
    vy,
    dir8,
    facing,
    vertical,
    isMoving: Math.hypot(vx, vy) > 6,
  };
}

/**
 * Converts world coordinates to tile grid indices.
 */
export function worldToTile(x: number, y: number): { col: number; row: number } {
  const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / TILE_SIZE)));
  const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / TILE_SIZE)));
  return { col, row };
}

/**
 * Converts tile grid indices to tile center world coordinates.
 */
export function tileToWorldCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function findNearestWalkableTile(
  targetCol: number,
  targetRow: number,
  walkableGrid: boolean[][]
): { col: number; row: number } | null {
  if (walkableGrid[targetRow]?.[targetCol]) {
    return { col: targetCol, row: targetRow };
  }
  for (let radius = 1; radius <= 12; radius++) {
    let best: { col: number; row: number; dist: number } | null = null;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = targetRow + dr;
        const c = targetCol + dc;
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && walkableGrid[r][c]) {
          const d = Math.hypot(dc, dr);
          if (!best || d < best.dist) {
            best = { col: c, row: r, dist: d };
          }
        }
      }
    }
    if (best) return { col: best.col, row: best.row };
  }
  return null;
}

/**
 * A* 8-Directional Pathfinding on the 36x18 Tavern Grid.
 */
export function findPathAStar(
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  obstacles: WorldObstacle[] = TAVERN_OBSTACLES
): Waypoint[] {
  const walkable: boolean[][] = Array.from({ length: GRID_ROWS }, (_, r) =>
    Array.from({ length: GRID_COLS }, (__, c) => {
      const center = tileToWorldCenter(c, r);
      return isWorldPointWalkable(center.x, center.y, obstacles, PLAYER_COLLISION_RADIUS - 2);
    })
  );

  const startTileRaw = worldToTile(startX, startY);
  const goalTileRaw = worldToTile(goalX, goalY);

  const startTile = findNearestWalkableTile(startTileRaw.col, startTileRaw.row, walkable);
  const goalTile = findNearestWalkableTile(goalTileRaw.col, goalTileRaw.row, walkable);

  if (!startTile || !goalTile) return [];
  if (startTile.col === goalTile.col && startTile.row === goalTile.row) {
    const exactWalkable = isWorldPointWalkable(goalX, goalY, obstacles, PLAYER_COLLISION_RADIUS - 2);
    return [
      exactWalkable
        ? { x: goalX, y: goalY }
        : tileToWorldCenter(goalTile.col, goalTile.row),
    ];
  }

  const key = (c: number, r: number) => r * GRID_COLS + c;
  const gScore = new Float64Array(GRID_COLS * GRID_ROWS).fill(Infinity);
  const fScore = new Float64Array(GRID_COLS * GRID_ROWS).fill(Infinity);
  const cameFrom = new Int32Array(GRID_COLS * GRID_ROWS).fill(-1);
  const closed = new Uint8Array(GRID_COLS * GRID_ROWS);

  const startIdx = key(startTile.col, startTile.row);
  const goalIdx = key(goalTile.col, goalTile.row);

  gScore[startIdx] = 0;
  fScore[startIdx] = Math.hypot(goalTile.col - startTile.col, goalTile.row - startTile.row);

  const openSet: number[] = [startIdx];

  const dirs = [
    { dc: 0, dr: -1, cost: 1 },
    { dc: 1, dr: 0, cost: 1 },
    { dc: 0, dr: 1, cost: 1 },
    { dc: -1, dr: 0, cost: 1 },
    { dc: 1, dr: -1, cost: Math.SQRT2 },
    { dc: 1, dr: 1, cost: Math.SQRT2 },
    { dc: -1, dr: 1, cost: Math.SQRT2 },
    { dc: -1, dr: -1, cost: Math.SQRT2 },
  ];

  while (openSet.length > 0) {
    let bestPos = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore[openSet[i]] < fScore[openSet[bestPos]]) {
        bestPos = i;
      }
    }
    const current = openSet[bestPos];
    openSet.splice(bestPos, 1);

    if (current === goalIdx) {
      const waypoints: Waypoint[] = [];
      let curr = current;
      while (curr !== -1 && curr !== startIdx) {
        const r = Math.floor(curr / GRID_COLS);
        const c = curr % GRID_COLS;
        waypoints.push(tileToWorldCenter(c, r));
        curr = cameFrom[curr];
      }
      waypoints.reverse();
      if (
        waypoints.length > 0 &&
        isWorldPointWalkable(goalX, goalY, obstacles, PLAYER_COLLISION_RADIUS - 2)
      ) {
        waypoints[waypoints.length - 1] = { x: goalX, y: goalY };
      }
      return waypoints;
    }

    closed[current] = 1;
    const curR = Math.floor(current / GRID_COLS);
    const curC = current % GRID_COLS;

    for (const d of dirs) {
      const nc = curC + d.dc;
      const nr = curR + d.dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      if (!walkable[nr][nc]) continue;

      if (d.dc !== 0 && d.dr !== 0) {
        if (!walkable[curR][nc] || !walkable[nr][curC]) continue;
      }

      const nIdx = key(nc, nr);
      if (closed[nIdx]) continue;

      const tentativeG = gScore[current] + d.cost;
      if (tentativeG < gScore[nIdx]) {
        cameFrom[nIdx] = current;
        gScore[nIdx] = tentativeG;
        fScore[nIdx] = tentativeG + Math.hypot(goalTile.col - nc, goalTile.row - nr);
        if (!openSet.includes(nIdx)) {
          openSet.push(nIdx);
        }
      }
    }
  }

  return [];
}

/**
 * Advances the player along an A* path of waypoints with smooth acceleration/deceleration.
 */
export function stepPathFollowing(
  state: PlayerPhysicsState,
  path: Waypoint[],
  obstacles: WorldObstacle[] = TAVERN_OBSTACLES,
  dt: number
): { nextState: PlayerPhysicsState; remainingPath: Waypoint[]; arrived: boolean } {
  if (path.length === 0) {
    const stopped = stepFreeMovementPhysics(state, 0, 0, obstacles, dt);
    return { nextState: stopped, remainingPath: [], arrived: true };
  }

  const nextWp = path[0];
  const dx = nextWp.x - state.x;
  const dy = nextWp.y - state.y;
  const dist = Math.hypot(dx, dy);

  const arrivalThreshold = path.length === 1 ? 10 : 18;
  if (dist <= arrivalThreshold) {
    const remaining = path.slice(1);
    if (remaining.length === 0) {
      return {
        nextState: {
          ...state,
          x: nextWp.x,
          y: nextWp.y,
          vx: 0,
          vy: 0,
          isMoving: false,
        },
        remainingPath: [],
        arrived: true,
      };
    }
    const nextTarget = remaining[0];
    const ndx = nextTarget.x - state.x;
    const ndy = nextTarget.y - state.y;
    const ndist = Math.max(1, Math.hypot(ndx, ndy));
    const stepped = stepFreeMovementPhysics(state, ndx / ndist, ndy / ndist, obstacles, dt);
    return { nextState: stepped, remainingPath: remaining, arrived: false };
  }

  const slowFactor = path.length === 1 && dist < 40 ? Math.max(0.4, dist / 40) : 1;
  const inputX = (dx / dist) * slowFactor;
  const inputY = (dy / dist) * slowFactor;
  const nextState = stepFreeMovementPhysics(state, inputX, inputY, obstacles, dt);

  return {
    nextState,
    remainingPath: path,
    arrived: false,
  };
}

/**
 * Finds the nearest interactive station within proximity radius of the player.
 */
export function findNearestInteractable(
  playerX: number,
  playerY: number,
  stations: TavernInteractiveStation[] = TAVERN_INTERACTIVE_STATIONS
): { station: TavernInteractiveStation; distance: number; inRange: boolean } | null {
  let best: { station: TavernInteractiveStation; distance: number; inRange: boolean } | null =
    null;

  for (const st of stations) {
    const dInteract = Math.hypot(playerX - st.interactX, playerY - st.interactY);
    const dObject = Math.hypot(playerX - st.objectX, playerY - st.objectY);
    const dist = Math.min(dInteract, dObject);
    const inRange = dist <= st.proximityRadius;

    if (!best || dist < best.distance) {
      best = { station: st, distance: dist, inRange };
    }
  }

  return best;
}

/**
 * Smoothly interpolates the 3rd-person camera toward the player while clamping to world edges.
 */
export function stepCameraLerp(
  camX: number,
  camY: number,
  playerX: number,
  playerY: number,
  viewportW: number,
  viewportH: number,
  dt: number,
  lerpSpeed = 8.0
): { camX: number; camY: number } {
  const desiredX = playerX - viewportW / 2;
  const desiredY = playerY - viewportH * 0.62;

  const maxCamX = Math.max(0, WORLD_WIDTH - viewportW);
  const maxCamY = Math.max(0, WORLD_HEIGHT - viewportH);

  const clampedTargetX = Math.max(0, Math.min(maxCamX, desiredX));
  const clampedTargetY = Math.max(0, Math.min(maxCamY, desiredY));

  const alpha = 1 - Math.exp(-lerpSpeed * Math.min(0.1, Math.max(0.001, dt)));
  return {
    camX: camX + (clampedTargetX - camX) * alpha,
    camY: camY + (clampedTargetY - camY) * alpha,
  };
}

/**
 * Depth-sorts renderable entities by their bottom Y coordinate (Painter's algorithm for 3/4 RPG view).
 */
export function sortRenderablesByDepth<T extends { depthY: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.depthY - b.depthY);
}
