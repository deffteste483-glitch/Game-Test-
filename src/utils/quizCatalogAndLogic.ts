import { MusicalAffinity } from './authLogic';

export type CardRarity = 'Lendária' | 'Épica' | 'Rara' | 'Comum';

export interface QuizArtistEntry {
  id: string;
  name: string;
  band: string;
  aliases?: string[];
  country: string;
  iconicWork: string;
  affinity: MusicalAffinity;
  era: string;
  rarity: CardRarity;
  rarityLabel: string;
  rarityColor: string;
  biography: string;
  coatColor: string;
  hairColor: string;
  instrumentColor: string;
  sepiaTone: string;
  /** 5 progressive clues unlocked independently per player */
  hints: [string, string, string, string, string];
}

export const MAX_QUIZ_PLAYERS = 8;
export const DEFAULT_MAX_ATTEMPTS = 4;
export const MAX_HINTS_PER_PLAYER = 5;

/**
 * Unified Real-Life Artist & Collectible Card Database for the Musical Tavern.
 * Contains 12 legendary real-world musicians and bands across all musical affinities.
 */
export const QUIZ_ARTISTS_DB: QuizArtistEntry[] = [
  {
    id: 'artist_julian',
    name: 'Freddie Mercury',
    band: 'Queen',
    aliases: ['Farrokh Bulsara', 'Freddie', 'Mercury', 'Queen'],
    country: 'Reino Unido / Zanzibar',
    iconicWork: 'Bohemian Rhapsody (1975)',
    affinity: 'Rock Clássico & Progressivo',
    era: 'Rock Clássico & Ópera-Rock · Anos 1970–1980',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Vocalista, pianista e compositor de alcance vocal lendário e presença de palco magnética. Revolucionou o rock com harmonias operísticas no Queen e protagonizou a apresentação histórica no Live Aid de 1985.',
    coatColor: '#d9a738',
    hairColor: '#171210',
    instrumentColor: '#8c2b40',
    sepiaTone: '#e8c99b',
    hints: [
      'Gênero & Era: Ícone do Rock Clássico e Ópera-Rock britânico consagrado nos anos 1970 e 1980.',
      'Instrumento & Palco: Pianista e cantor famoso pela jaqueta amarela de Wembley (1986) e pelo microfone com pedestal sem a base.',
      'Obra Célebre: Compôs o clássico "Bohemian Rhapsody" (álbum A Night at the Opera, 1975), "Somebody to Love" e "We Are the Champions".',
      'Curiosidade Real: Nascido em Zanzibar como Farrokh Bulsara, comandou 72 mil pessoas em coro no concerto Live Aid de 1985.',
      'Banda & Iniciais: Frontman lendário da banda britânica Queen (Iniciais: F. M.).',
    ],
  },
  {
    id: 'artist_astrid',
    name: 'Tarja Turunen',
    band: 'Nightwish',
    aliases: ['Tarja', 'Nightwish'],
    country: 'Finlândia',
    iconicWork: 'Once / Ghost Love Score (2004)',
    affinity: 'Metal Sinfônico & Épico',
    era: 'Metal Sinfônico & Épico · Anos 1990–2000',
    rarity: 'Épica',
    rarityLabel: 'Insígnia Carmesim',
    rarityColor: '#82243a',
    biography:
      'Soprano lírica finlandesa formada na Academia Sibelius que popularizou mundialmente o Metal Sinfônico ao unir canto operístico erudito a guitarras pesadas e orquestrações épicas.',
    coatColor: '#283c5c',
    hairColor: '#1b110c',
    instrumentColor: '#8c2b40',
    sepiaTone: '#c8d6e5',
    hints: [
      'Gênero & Origem: Pioneira do Metal Sinfônico formada em canto lírico na Academia Sibelius, na Finlândia.',
      'Instrumento & Estilo: Voz de soprano dramático com alcance de três oitavas combinada a arranjos orquestrais e metal.',
      'Obra Célebre: Imortalizou os álbuns "Oceanborn" (1998), "Wishmaster" (2000) e "Once" (2004), com hinos como "Nemo" e "Sleeping Sun".',
      'Curiosidade Real: Recebeu da imprensa europeia o título de "Rainha Finlandesa do Metal Sinfônico" antes de seguir carreira solo lírica.',
      'Banda & Iniciais: Vocalista clássica que consagrou a banda finlandesa Nightwish (Iniciais: T. T.).',
    ],
  },
  {
    id: 'artist_mateo',
    name: 'Raul Seixas',
    band: 'Raulzito e os Panteras',
    aliases: ['Raulzito', 'Maluco Beleza', 'Raul'],
    country: 'Brasil (Salvador, BA)',
    iconicWork: 'Krig-ha, Bandolo! / Gita (1973–1974)',
    affinity: 'MPB & Folk Acústico',
    era: 'Rock & Folk Brasileiro · Anos 1970–1980',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Cantor, compositor e multi-instrumentista baiano reverenciado como o Pai do Rock Brasileiro, mestre em fundir o folk acústico, o rock dos anos 50 e o baião nordestino de Luiz Gonzaga.',
    coatColor: '#294a30',
    hairColor: '#24140c',
    instrumentColor: '#c58b38',
    sepiaTone: '#e0c097',
    hints: [
      'Gênero & Origem: Pioneiro da música brasileira nascido em Salvador (BA), que fundiu o baião nordestino ao rock e folk acústico.',
      'Instrumento & Estilo: Violão de aço e guitarra em baladas filosóficas, místicas e bem-humoradas.',
      'Obra Célebre: Autor de hinos atemporais como "Metamorfose Ambulante", "Ouro de Tolo", "Gita" e "Tente Outra Vez".',
      'Curiosidade Real: Antes do estrelato solo nos anos 70, atuou como produtor musical na CBS e liderou o conjunto "Raulzito e os Panteras".',
      'Alcunha & Iniciais: O eterno "Maluco Beleza" da música brasileira (Iniciais: R. S.).',
    ],
  },
  {
    id: 'artist_celeste',
    name: 'Nina Simone',
    band: 'High Priestess of Soul',
    aliases: ['Eunice Kathleen Waymon', 'Nina'],
    country: 'Estados Unidos',
    iconicWork: 'Pastel Blues / Feeling Good (1965)',
    affinity: 'Jazz, Blues & Soul',
    era: 'Jazz, Blues & Soul · Anos 1950–1970',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Pianista de formação clássica, cantora de contralto profundo e arranjadora norte-americana que uniu o contraponto de Johann Sebastian Bach ao jazz, blues, gospel e soul.',
    coatColor: '#4a235a',
    hairColor: '#140c08',
    instrumentColor: '#d4ac0d',
    sepiaTone: '#d7bde2',
    hints: [
      'Gênero & Era: Lenda do Jazz, Blues e Soul norte-americano consagrada a partir do álbum "Little Girl Blue" (1958).',
      'Instrumento & Estilo: Pianista virtuosa apaixonada pelo contraponto de J.S. Bach e dona de uma voz de contralto intensa.',
      'Obra Célebre: Imortalizou clássicos como "Feeling Good", "I Put a Spell on You", "Sinnerman" e "My Baby Just Cares for Me".',
      'Curiosidade Real: Nascida Eunice Kathleen Waymon, criou seu nome artístico a partir do apelido "Niña" e da atriz francesa Simone Signoret.',
      'Alcunha & Iniciais: Reverenciada mundialmente como a "Alta Sacerdotisa do Soul" (Iniciais: N. S.).',
    ],
  },
  {
    id: 'artist_orion',
    name: 'Jimmy Page',
    band: 'Led Zeppelin',
    aliases: ['Led Zeppelin', 'The Yardbirds', 'Page'],
    country: 'Reino Unido',
    iconicWork: 'Led Zeppelin IV / Stairway to Heaven (1971)',
    affinity: 'Rock Clássico & Progressivo',
    era: 'Hard Rock & Folk Britânico · Anos 1960–1970',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Guitarrista virtuoso, compositor e produtor britânico que redefiniu o rock ao unir baladas acústicas de inspiração celta e medieval aos riffs elétricos monumentais do Led Zeppelin.',
    coatColor: '#7b241c',
    hairColor: '#1f1612',
    instrumentColor: '#b85d19',
    sepiaTone: '#edbb99',
    hints: [
      'Gênero & Era: Arquiteto do Hard Rock e Folk-Rock britânico nos anos 1960 e 1970.',
      'Instrumento & Palco: Famoso pela guitarra Gibson EDS-1275 de dois braços (6 e 12 cordas) e por tocar solos usando um arco de violino.',
      'Obra Célebre: Compôs e produziu a épica "Stairway to Heaven" (1971), além de "Kashmir", "Black Dog" e "Whole Lotta Love".',
      'Curiosidade Real: Foi um dos músicos de estúdio mais requisitados de Londres nos anos 60 e integrou os Yardbirds antes de 1968.',
      'Banda & Iniciais: Fundador e guitarrista do lendário Led Zeppelin (Iniciais: J. P.).',
    ],
  },
  {
    id: 'artist_clara',
    name: 'Florence Welch',
    band: 'Florence + The Machine',
    aliases: ['Florence and the Machine', 'Florence'],
    country: 'Reino Unido',
    iconicWork: 'Lungs / Dog Days Are Over (2009)',
    affinity: 'Pop, Indie & Alternativo',
    era: 'Indie Rock & Art-Pop Barroco · Anos 2000–2020',
    rarity: 'Rara',
    rarityLabel: 'Relíquia de Carvalho',
    rarityColor: '#2e6b3e',
    biography:
      'Cantora e compositora londrina conhecida por seus vocais dramáticos, harpas celtas, percussão grandiosa e estética inspirada na literatura e na arte renascentista.',
    coatColor: '#1f618d',
    hairColor: '#b9461b',
    instrumentColor: '#d35400',
    sepiaTone: '#aed6f1',
    hints: [
      'Gênero & Origem: Estrela do Indie Rock e Art-Pop barroco revelada em Londres no final dos anos 2000.',
      'Instrumento & Estilo: Arranjos marcados por harpas acústicas, tambores tribais, coros grandiosos e performances descalça no palco.',
      'Obra Célebre: Álbum de estreia "Lungs" (2009), com os sucessos "Dog Days Are Over", "Cosmic Love", "Shake It Out" e "Spectrum".',
      'Curiosidade Real: O nome de sua banda surgiu de uma parceria de adolescência com Isabella Summers ("Florence Robot / Isa Machine").',
      'Banda & Iniciais: Vocalista e líder de Florence + The Machine (Iniciais: F. W.).',
    ],
  },
  {
    id: 'artist_balthazar',
    name: 'B.B. King',
    band: 'O Rei do Blues (Lucille)',
    aliases: ['BB King', 'Riley B. King', 'Lucille'],
    country: 'Estados Unidos (Mississippi)',
    iconicWork: 'Live at the Regal / The Thrill Is Gone (1965–1969)',
    affinity: 'Jazz, Blues & Soul',
    era: 'Blues Elétrico & Soul · Anos 1950–2000',
    rarity: 'Épica',
    rarityLabel: 'Insígnia Carmesim',
    rarityColor: '#82243a',
    biography:
      'Mestre supremo do blues elétrico nascido no Delta do Mississippi, célebre por seu vibrato de pulso inconfundível e bends expressivos que faziam sua guitarra cantar como voz humana.',
    coatColor: '#5c361e',
    hairColor: '#1c130e',
    instrumentColor: '#2b1b12',
    sepiaTone: '#e59866',
    hints: [
      'Gênero & Origem: Patriarca do Blues elétrico nascido em Itta Bena, no coração do Mississippi (EUA).',
      'Instrumento & Estilo: Guitarra semiacústica Gibson ES-355 preta com vibrato "borboleta" e solos melódicos nota a nota.',
      'Obra Célebre: Imortalizou "The Thrill Is Gone" (1969), "Every Day I Have the Blues" e "Sweet Little Angel".',
      'Curiosidade Real: Em 1949, salvou sua guitarra de um salão em chamas no Arkansas e batizou todas as suas guitarras seguintes de "Lucille".',
      'Alcunha & Iniciais: Reverenciado como "O Rei do Blues" — Riley B. King, o "Blues Boy" de Memphis (Iniciais: B.B. K.).',
    ],
  },
  {
    id: 'artist_valkyria',
    name: 'Bruce Dickinson',
    band: 'Iron Maiden',
    aliases: ['Iron Maiden', 'Bruce', 'Air Raid Siren'],
    country: 'Reino Unido',
    iconicWork: 'The Number of the Beast / Powerslave (1982–1984)',
    affinity: 'Metal Sinfônico & Épico',
    era: 'Heavy Metal Épico Britânico · Anos 1980–Presente',
    rarity: 'Épica',
    rarityLabel: 'Insígnia Carmesim',
    rarityColor: '#82243a',
    biography:
      'Vocalista britânico ícone do Heavy Metal épico, historiador, esgrimista e comandante de aviação comercial, famoso por cantar batalhas históricas e literatura clássica.',
    coatColor: '#34495e',
    hairColor: '#4a3222',
    instrumentColor: '#a04000',
    sepiaTone: '#d5dbdb',
    hints: [
      'Gênero & Era: Voz lendária da Nova Onda do Heavy Metal Britânico (NWOBHM), consagrado mundialmente a partir de 1982.',
      'Instrumento & Estilo: Alcance vocal operístico e vigoroso que lhe rendeu o apelido de "The Air-Raid Siren" (Sirene de Ataque Aéreo).',
      'Obra Célebre: Clássicos épicos como "The Trooper", "Fear of the Dark", "Aces High", "Run to the Hills" e "Hallowed Be Thy Name".',
      'Curiosidade Real: Formado em História, é esgrimista internacional e piloto que comandou pessoalmente o Boeing 747 "Ed Force One" em turnês mundiais.',
      'Banda & Iniciais: Frontman histórico da banda britânica Iron Maiden (Iniciais: B. D.).',
    ],
  },
  {
    id: 'artist_ritalee',
    name: 'Rita Lee',
    band: 'Os Mutantes & Tutti Frutti',
    aliases: ['Os Mutantes', 'Tutti Frutti', 'Rainha do Rock Brasileiro'],
    country: 'Brasil (São Paulo, SP)',
    iconicWork: 'Fruto Proibido / Ovelha Negra (1975)',
    affinity: 'Pop, Indie & Alternativo',
    era: 'Tropicália, Rock & Pop Brasileiro · Anos 1960–2020',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Cantora, compositora e multi-instrumentista paulistana aclamada como a "Rainha do Rock Brasileiro", pioneira da psicodelia tropicalista com Os Mutantes e autora de clássicos imortais.',
    coatColor: '#8c2b40',
    hairColor: '#c0392b',
    instrumentColor: '#d4ac0d',
    sepiaTone: '#f5cba7',
    hints: [
      'Gênero & Origem: Padroeira da liberdade e "Rainha do Rock Brasileiro", nascida em São Paulo.',
      'Instrumento & Visual: Multi-instrumentista (flauta transversal, violão, sintetizador) famosa pela franja ruiva e óculos redondos coloridos.',
      'Obra Célebre: Autora do álbum "Fruto Proibido" (1975) e de hinos como "Ovelha Negra", "Mania de Você", "Lança Perfume" e "Amor e Sexo".',
      'Curiosidade Real: Fundou em 1966 a revolucionária banda psicodélica Os Mutantes ao lado dos irmãos Arnaldo Baptista e Sérgio Dias.',
      'Banda & Iniciais: Estrela d\'Os Mutantes, do grupo Tutti Frutti e de brilhante carreira solo (Iniciais: R. L.).',
    ],
  },
  {
    id: 'artist_bowie',
    name: 'David Bowie',
    band: 'Ziggy Stardust & The Spiders from Mars',
    aliases: ['Ziggy Stardust', 'Bowie', 'Major Tom', 'David Robert Jones'],
    country: 'Reino Unido',
    iconicWork: 'The Rise and Fall of Ziggy Stardust (1972)',
    affinity: 'Rock Clássico & Progressivo',
    era: 'Glam Rock & Art Rock · Anos 1960–2010',
    rarity: 'Lendária',
    rarityLabel: 'Lenda Dourada',
    rarityColor: '#d9a738',
    biography:
      'Cantor, compositor e multi-instrumentista britânico conhecido como o "Camaleão do Rock", que transformou a história da música com personas como Major Tom, Ziggy Stardust e Aladdin Sane.',
    coatColor: '#1f618d',
    hairColor: '#d35400',
    instrumentColor: '#e67e22',
    sepiaTone: '#d6eaf8',
    hints: [
      'Gênero & Era: O "Camaleão do Rock", pioneiro do Glam Rock, Art Rock e Soul plástico desde o final dos anos 1960.',
      'Instrumento & Visual: Violão de 12 cordas, saxofone e a icônica pintura de um raio vermelho e azul atravessando o rosto (Aladdin Sane, 1973).',
      'Obra Célebre: Criador de "Space Oddity" (1969), "Starman", "Heroes", "Life on Mars?" e "Let\'s Dance".',
      'Curiosidade Real: Nascido David Robert Jones em Brixton, tinha a pupila esquerda permanentemente dilatada (anisocoria) desde a adolescência.',
      'Persona & Iniciais: Criador do alter ego espacial Ziggy Stardust (Iniciais: D. B.).',
    ],
  },
  {
    id: 'artist_milton',
    name: 'Milton Nascimento',
    band: 'Clube da Esquina',
    aliases: ['Bituca', 'Clube da Esquina', 'Milton'],
    country: 'Brasil (Minas Gerais / RJ)',
    iconicWork: 'Clube da Esquina / Travessia (1967–1972)',
    affinity: 'MPB & Folk Acústico',
    era: 'MPB & Harmonia Mineira · Anos 1960–Presente',
    rarity: 'Rara',
    rarityLabel: 'Relíquia de Carvalho',
    rarityColor: '#2e6b3e',
    biography:
      'Cantor, violonista e compositor brasileiro reverenciado mundialmente por sua voz celestial e pelas harmonias sofisticadas do movimento Clube da Esquina.',
    coatColor: '#2e6b3e',
    hairColor: '#17100c',
    instrumentColor: '#b87d28',
    sepiaTone: '#d4efdf',
    hints: [
      'Gênero & Origem: Lenda da MPB criado em Três Pontas (Minas Gerais), reverenciado por músicos de folk, rock e jazz do mundo inteiro.',
      'Instrumento & Estilo: Violão e sanfona aliados a um alcance vocal e falsete límpido que Elis Regina definiu como "a voz de Deus".',
      'Obra Célebre: Autor de "Travessia", "Maria, Maria", "Canção da América" e do álbum duplo histórico "Clube da Esquina" (1972, com Lô Borges).',
      'Curiosidade Real: Gravou com o saxofonista Wayne Shorter o clássico álbum de jazz "Native Dancer" (1975) e tem o apelido carinhoso de "Bituca".',
      'Movimento & Iniciais: Fundador do movimento musical mineiro Clube da Esquina (Iniciais: M. N.).',
    ],
  },
  {
    id: 'artist_amy',
    name: 'Amy Winehouse',
    band: 'The Dap-Kings (Back to Black)',
    aliases: ['Amy', 'Back to Black'],
    country: 'Reino Unido (Londres)',
    iconicWork: 'Back to Black / Rehab (2006)',
    affinity: 'Jazz, Blues & Soul',
    era: 'Neo-Soul, R&B & Jazz Vocal · Anos 2000',
    rarity: 'Comum',
    rarityLabel: 'Selo de Bronze',
    rarityColor: '#8d6e63',
    biography:
      'Cantora, compositora e guitarrista londrina de voz contralto inconfundível que revitalizou o soul clássico dos anos 60 e o jazz vocal no século XXI, vencendo cinco prêmios Grammy em uma única noite.',
    coatColor: '#2c1810',
    hairColor: '#120b07',
    instrumentColor: '#c0392b',
    sepiaTone: '#e6b0aa',
    hints: [
      'Gênero & Origem: Estrela britânica do Soul, Jazz e R&B nascida em Southgate, no norte de Londres.',
      'Instrumento & Visual: Voz de contralto profunda, guitarra Fender Stratocaster e o icônico penteado "beehive" (colmeia) com delineador gatinho.',
      'Obra Célebre: Álbum histórico "Back to Black" (2006), com os clássicos "Rehab", "You Know I\'m No Good", "Love Is a Losing Game" e "Valerie".',
      'Curiosidade Real: Seu álbum de estreia, "Frank" (2003), foi batizado em homenagem ao seu grande ídolo do jazz, Frank Sinatra.',
      'Banda & Iniciais: Gravou seus maiores clássicos acompanhada pela banda de soul The Dap-Kings (Iniciais: A. W.).',
    ],
  },
];

export interface QuizGuessRecord {
  guessText: string;
  isCorrect: boolean;
  hintLevelAtGuess: number;
  pointsAwarded: number;
}

export interface QuizPlayerSeat {
  playerId: string;
  playerName: string;
  isBot: boolean;
  avatarColor: string;
  /** Number of clues unlocked by THIS player (1..5) — completely independent of other players */
  hintsRevealed: number;
  /** Number of guess attempts used by THIS player (0..maxAttempts) */
  attemptsUsed: number;
  maxAttempts: number;
  guessHistory: QuizGuessRecord[];
  status: 'playing' | 'solved' | 'exhausted';
  scoreEarned: number;
  solvedAtTurn?: number;
}

export interface QuizMatchState {
  matchId: string;
  roomCode: string;
  mode: 'solo' | 'multiplayer';
  tableName: string;
  /** All players in the match receive the exact same secret artist for the round */
  targetArtistId: string;
  roundNumber: number;
  currentTurnIndex: number;
  turnCounter: number;
  players: QuizPlayerSeat[];
  phase: 'lobby' | 'active_round' | 'round_finished';
  winnerPlayerIds: string[];
  createdAtMs: number;
}

export interface PlayerQuizStats {
  matchesPlayed: number;
  matchesWon: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
}

export interface PlayerProgressionState {
  travelerId: string;
  unlockedArtistIds: string[];
  stats: PlayerQuizStats;
}

export const PROGRESSION_STORAGE_PREFIX = 'musical_tavern_progression_v1_';
export const ROOM_STORAGE_PREFIX = 'musical_tavern_room_v1_';

export const TAVERN_BOT_COMPANIONS: {
  id: string;
  name: string;
  color: string;
}[] = [
  { id: 'bot_garrick', name: 'Sir Garrick', color: '#294a30' },
  { id: 'bot_mirela', name: 'Cronista Mirela', color: '#293e5c' },
  { id: 'bot_thom', name: 'Bardo Thom', color: '#5c361e' },
  { id: 'bot_freya', name: 'Artífice Freya', color: '#4a121f' },
  { id: 'bot_lirael', name: 'Bardo Lirael', color: '#6b1d2f' },
  { id: 'bot_elena', name: 'Anfitriã Elena', color: '#7a283b' },
  { id: 'bot_barnaby', name: 'Mestre Barnaby', color: '#6d4c41' },
];

/**
 * Normalizes strings for accent-insensitive, case-insensitive artist/band matching.
 */
export function normalizeQuizString(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a player's guess matches the target real-life artist (by artist name, band name, alias, or distinctive token).
 */
export function isGuessMatchingArtist(
  rawGuess: string,
  artist: QuizArtistEntry
): boolean {
  const normGuess = normalizeQuizString(rawGuess);
  if (!normGuess || normGuess.length < 3) return false;

  const normName = normalizeQuizString(artist.name);
  const normBand = normalizeQuizString(artist.band);

  if (normGuess === normName || normGuess === normBand) return true;
  if (normName.includes(normGuess) && normGuess.length >= 4) return true;
  if (normBand.includes(normGuess) && normGuess.length >= 4) return true;

  if (artist.aliases) {
    for (const alias of artist.aliases) {
      const normAlias = normalizeQuizString(alias);
      if (normGuess === normAlias) return true;
      if (normAlias.includes(normGuess) && normGuess.length >= 4) return true;
    }
  }

  return false;
}

/**
 * Computes score awarded when solving an artist based on independent hints revealed and attempts used.
 * Fewer hints and fewer attempts yield higher points!
 */
export function calculateQuizScore(
  hintsRevealed: number,
  attemptsUsedBeforeSolve: number
): number {
  const baseScore = 1000;
  const hintPenalty = Math.max(0, hintsRevealed - 1) * 140;
  const attemptPenalty = Math.max(0, attemptsUsedBeforeSolve) * 110;
  return Math.max(200, baseScore - hintPenalty - attemptPenalty);
}

/**
 * Creates a new Quiz Match (Solo or Turn-Based Multiplayer for 1..8 players).
 * All players in the match receive the exact same targetArtistId, while keeping independent hints & attempts.
 */
export function createQuizMatch(options: {
  mode: 'solo' | 'multiplayer';
  tableName: string;
  hostPlayer: { id: string; name: string };
  additionalPlayers?: { id: string; name: string; isBot?: boolean; color?: string }[];
  targetArtistId?: string;
  roomCode?: string;
  roundNumber?: number;
}): QuizMatchState {
  const {
    mode,
    tableName,
    hostPlayer,
    additionalPlayers = [],
    targetArtistId,
    roomCode = `TAV-${Math.floor(1000 + Math.random() * 9000)}`,
    roundNumber = 1,
  } = options;

  const chosenArtist =
    QUIZ_ARTISTS_DB.find((a) => a.id === targetArtistId) ||
    QUIZ_ARTISTS_DB[(roundNumber - 1) % QUIZ_ARTISTS_DB.length];

  const rawList = [
    {
      id: hostPlayer.id,
      name: hostPlayer.name,
      isBot: false,
      color: '#6b1d2f',
    },
    ...(mode === 'multiplayer' ? additionalPlayers : []),
  ].slice(0, MAX_QUIZ_PLAYERS);

  const players: QuizPlayerSeat[] = rawList.map((p, idx) => ({
    playerId: p.id,
    playerName: p.name,
    isBot: Boolean(p.isBot),
    avatarColor: p.color || TAVERN_BOT_COMPANIONS[idx % TAVERN_BOT_COMPANIONS.length].color,
    hintsRevealed: 1, // Clue #1 is visible to start
    attemptsUsed: 0,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    guessHistory: [],
    status: 'playing',
    scoreEarned: 0,
  }));

  return {
    matchId: `match-${Date.now()}`,
    roomCode,
    mode,
    tableName,
    targetArtistId: chosenArtist.id,
    roundNumber,
    currentTurnIndex: 0,
    turnCounter: 1,
    players,
    phase: 'active_round',
    winnerPlayerIds: [],
    createdAtMs: Date.now(),
  };
}

/**
 * Finds the next player index who is still in 'playing' status, or -1 if all players have finished.
 */
export function findNextActivePlayerIndex(
  players: QuizPlayerSeat[],
  fromIndex: number
): number {
  const total = players.length;
  if (total === 0) return -1;
  for (let offset = 1; offset <= total; offset++) {
    const candidateIdx = (fromIndex + offset) % total;
    if (players[candidateIdx].status === 'playing') {
      return candidateIdx;
    }
  }
  return -1;
}

/**
 * Reveals the next clue ONLY for the specified player (up to 5 clues).
 * Other players' hintsRevealed counts remain completely untouched.
 */
export function revealNextHintForPlayer(
  match: QuizMatchState,
  playerId: string
): QuizMatchState {
  if (match.phase !== 'active_round') return match;

  const updatedPlayers = match.players.map((p) => {
    if (p.playerId !== playerId || p.status !== 'playing') return p;
    return {
      ...p,
      hintsRevealed: Math.min(MAX_HINTS_PER_PLAYER, p.hintsRevealed + 1),
    };
  });

  return {
    ...match,
    players: updatedPlayers,
  };
}

/**
 * Submits a guess for a specific player during their turn.
 * - Updates only that player's attempts, guessHistory, status, and score.
 * - Advances the turn to the next active player (up to 8 players).
 * - Transitions the match to 'round_finished' when all players finish their independent attempts/solves.
 */
export function submitPlayerGuess(
  match: QuizMatchState,
  playerId: string,
  rawGuess: string
): QuizMatchState {
  if (match.phase !== 'active_round') return match;

  const targetArtist =
    QUIZ_ARTISTS_DB.find((a) => a.id === match.targetArtistId) || QUIZ_ARTISTS_DB[0];

  const playerIdx = match.players.findIndex((p) => p.playerId === playerId);
  if (playerIdx === -1) return match;

  const seat = match.players[playerIdx];
  if (seat.status !== 'playing') return match;

  const isCorrect = isGuessMatchingArtist(rawGuess, targetArtist);
  const points = isCorrect
    ? calculateQuizScore(seat.hintsRevealed, seat.attemptsUsed)
    : 0;

  const nextAttempts = seat.attemptsUsed + 1;
  const nextStatus: QuizPlayerSeat['status'] = isCorrect
    ? 'solved'
    : nextAttempts >= seat.maxAttempts
    ? 'exhausted'
    : 'playing';

  const newRecord: QuizGuessRecord = {
    guessText: rawGuess.trim(),
    isCorrect,
    hintLevelAtGuess: seat.hintsRevealed,
    pointsAwarded: points,
  };

  const updatedPlayers = match.players.map((p, idx) => {
    if (idx !== playerIdx) return p;
    return {
      ...p,
      attemptsUsed: nextAttempts,
      guessHistory: [...p.guessHistory, newRecord],
      status: nextStatus,
      scoreEarned: isCorrect ? points : p.scoreEarned,
      solvedAtTurn: isCorrect ? match.turnCounter : p.solvedAtTurn,
    };
  });

  const nextTurnIdx = findNextActivePlayerIndex(updatedPlayers, playerIdx);
  const allFinished = nextTurnIdx === -1;

  const winnerIds = updatedPlayers
    .filter((p) => p.status === 'solved')
    .sort((a, b) => b.scoreEarned - a.scoreEarned)
    .map((p) => p.playerId);

  return {
    ...match,
    players: updatedPlayers,
    currentTurnIndex: allFinished ? playerIdx : nextTurnIdx,
    turnCounter: match.turnCounter + 1,
    phase: allFinished ? 'round_finished' : 'active_round',
    winnerPlayerIds: winnerIds,
  };
}

/**
 * Executes an automated turn for a Tavern Bot seat (revealing a clue for itself and making a guess).
 */
export function executeBotTurn(match: QuizMatchState): QuizMatchState {
  if (match.phase !== 'active_round') return match;
  const currentSeat = match.players[match.currentTurnIndex];
  if (!currentSeat || !currentSeat.isBot || currentSeat.status !== 'playing') {
    return match;
  }

  const targetArtist =
    QUIZ_ARTISTS_DB.find((a) => a.id === match.targetArtistId) || QUIZ_ARTISTS_DB[0];

  // Bot unlocks a hint for itself if it has fewer than 4 hints
  let workingMatch = match;
  if (currentSeat.hintsRevealed < 4) {
    workingMatch = revealNextHintForPlayer(workingMatch, currentSeat.playerId);
  }

  const updatedSeat = workingMatch.players[workingMatch.currentTurnIndex];
  // Bot probability of guessing right increases with its own hintsRevealed
  const deterministicRoll =
    ((match.turnCounter * 37 + updatedSeat.hintsRevealed * 19) % 100) / 100;
  const solveThreshold = 0.22 * updatedSeat.hintsRevealed;

  if (deterministicRoll <= solveThreshold) {
    return submitPlayerGuess(workingMatch, updatedSeat.playerId, targetArtist.name);
  }

  // Otherwise bot guesses a distractor artist from the codex
  const distractors = QUIZ_ARTISTS_DB.filter((a) => a.id !== targetArtist.id);
  const wrongPick =
    distractors[(match.turnCounter + updatedSeat.attemptsUsed) % distractors.length];
  return submitPlayerGuess(workingMatch, updatedSeat.playerId, wrongPick.name);
}

/**
 * Starts the next round in the same room with a new secret artist for all players,
 * resetting per-round hints and attempts while preserving cumulative scores if desired.
 */
export function startNextQuizRound(match: QuizMatchState): QuizMatchState {
  const currentArtistIdx = QUIZ_ARTISTS_DB.findIndex(
    (a) => a.id === match.targetArtistId
  );
  const nextArtist =
    QUIZ_ARTISTS_DB[(currentArtistIdx + 1) % QUIZ_ARTISTS_DB.length];

  const resetPlayers: QuizPlayerSeat[] = match.players.map((p) => ({
    ...p,
    hintsRevealed: 1,
    attemptsUsed: 0,
    guessHistory: [],
    status: 'playing',
    solvedAtTurn: undefined,
  }));

  return {
    ...match,
    targetArtistId: nextArtist.id,
    roundNumber: match.roundNumber + 1,
    currentTurnIndex: 0,
    turnCounter: 1,
    players: resetPlayers,
    phase: 'active_round',
    winnerPlayerIds: [],
  };
}

/**
 * Loads a player's persistent progression (unlocked collectible cards + quiz stats) safely.
 */
export function loadPlayerProgression(travelerId: string): PlayerProgressionState {
  const defaultState: PlayerProgressionState = {
    travelerId,
    unlockedArtistIds: ['artist_julian', 'artist_astrid'],
    stats: {
      matchesPlayed: 0,
      matchesWon: 0,
      totalScore: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(`${PROGRESSION_STORAGE_PREFIX}${travelerId}`);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      travelerId,
      unlockedArtistIds: Array.isArray(parsed.unlockedArtistIds)
        ? parsed.unlockedArtistIds
        : defaultState.unlockedArtistIds,
      stats: {
        matchesPlayed: Number(parsed.stats?.matchesPlayed) || 0,
        matchesWon: Number(parsed.stats?.matchesWon) || 0,
        totalScore: Number(parsed.stats?.totalScore) || 0,
        currentStreak: Number(parsed.stats?.currentStreak) || 0,
        bestStreak: Number(parsed.stats?.bestStreak) || 0,
      },
    };
  } catch {
    return defaultState;
  }
}

/**
 * Saves a player's progression and unlocks the target artist card if the player solved the quiz.
 */
export function recordQuizResultForPlayer(
  currentProgression: PlayerProgressionState,
  targetArtistId: string,
  didSolve: boolean,
  scoreEarned: number
): PlayerProgressionState {
  const unlockedSet = new Set(currentProgression.unlockedArtistIds);
  if (didSolve) {
    unlockedSet.add(targetArtistId);
  }

  const nextStreak = didSolve ? currentProgression.stats.currentStreak + 1 : 0;
  const nextBestStreak = Math.max(currentProgression.stats.bestStreak, nextStreak);

  const updated: PlayerProgressionState = {
    travelerId: currentProgression.travelerId,
    unlockedArtistIds: Array.from(unlockedSet),
    stats: {
      matchesPlayed: currentProgression.stats.matchesPlayed + 1,
      matchesWon: currentProgression.stats.matchesWon + (didSolve ? 1 : 0),
      totalScore: currentProgression.stats.totalScore + Math.max(0, scoreEarned),
      currentStreak: nextStreak,
      bestStreak: nextBestStreak,
    },
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `${PROGRESSION_STORAGE_PREFIX}${currentProgression.travelerId}`,
        JSON.stringify(updated)
      );
    } catch {
      // ignore storage errors
    }
  }

  return updated;
}
