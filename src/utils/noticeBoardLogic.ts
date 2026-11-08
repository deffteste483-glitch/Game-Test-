export type BardNoteCategory = 'desafios' | 'baladas' | 'rumores';

export interface BardNote {
  id: string;
  title: string;
  author: string;
  authorTitle: string;
  category: BardNoteCategory;
  dateScroll: string;
  waxSealColor: string;
  waxSealLabel: string;
  previewSnippet: string;
  paragraphs: string[];
  musicalRiddle: string;
  applauseCount: number;
  pinnedPosition: { rotateDeg: number };
}

export const INITIAL_BARD_NOTES: BardNote[] = [
  {
    id: 'note_chord_riddle',
    title: 'O Enigma do Acorde de Âmbar',
    author: 'Aldous_Vane',
    authorTitle: 'Cronista das Seis Cordas',
    category: 'desafios',
    dateScroll: 'Noite III de Outono · Vigília da Lareira',
    waxSealColor: '#6b1d2f',
    waxSealLabel: 'Selo Carmesim',
    previewSnippet:
      'Aos ouvidos atentos que visitam o Palco Musical: descobri uma cadência ancestral capaz de acalmar até a tempestade lá fora...',
    paragraphs: [
      'Aos nobres viajantes e músicos que cruzam as portas de carvalho da Musical Tavern: durante minha última vigília junto ao fogo, decifrei um manuscrito deixado pelos primeiros trovadores deste salão.',
      'A partitura fala do “Acorde de Âmbar” — uma progressão onde o alaúde inicia em Ré Dórico, responde ao crepitar da lareira em Lá Menor e repousa em Sol Maior quando o vento sopra nas janelas.',
      'Quem subir ao Palco Musical e tocar o Ritmo Harmônico com espírito sereno verá as notas douradas dançarem sob os candelabros!',
    ],
    musicalRiddle: 'Cadência sugerida: Ré Dórico → Lá Menor → Sol Maior (Compasso 6/8)',
    applauseCount: 19,
    pinnedPosition: { rotateDeg: -1.5 },
  },
  {
    id: 'note_silver_lute',
    title: 'Procura-se Dueto para a Balada da Chuva',
    author: 'Helena_Lyra',
    authorTitle: 'Dama do Alaúde de Prata',
    category: 'baladas',
    dateScroll: 'Noite V de Outono · Chuva Fina',
    waxSealColor: '#283c5c',
    waxSealLabel: 'Selo Safira',
    previewSnippet:
      'Procuro um aventureiro versátil nas cordas ou percussão para acompanhar uma canção composta ao som das gotas nas vidraças...',
    paragraphs: [
      'Saudações aos bardos da taverna! Enquanto descansava nas Mesas & Banquetas observando a chuva escorrer pelas janelas de chumbo, escrevi os versos de uma nova canção instrumental.',
      'A melodia principal já está pronta para harpa e alaúde, mas falta um segundo músico para sustentar o contraponto grave nas passagens mais intensas.',
      'Se você veste a Túnica de Bardo ou carrega seu alaúde nas costas, deixe seu sinal neste pergaminho ou encontre-me próximo à Estante de Artistas!',
    ],
    musicalRiddle: 'Andamento: Andante Cantabile · Afinidade: Clássico, Folk & Instrumental',
    applauseCount: 24,
    pinnedPosition: { rotateDeg: 1.2 },
  },
  {
    id: 'note_barnaby_decree',
    title: 'Crônica dos Códices & Segredos do Salão',
    author: 'Barnaby',
    authorTitle: 'Anfitrião da Musical Tavern',
    category: 'rumores',
    dateScroll: 'Edital Permanente do Balcão',
    waxSealColor: '#9e6b1b',
    waxSealLabel: 'Selo de Ouro Antigo',
    previewSnippet:
      'Aviso oficial do balcão: novos volumes ilustrados chegaram à Estante de Artistas, revelando retratos reais e miniaturas 16-bit...',
    paragraphs: [
      'Bem-vindos ao nosso Mural de Avisos! Como anfitrião desta casa, fico honrado em ver tantos viajantes assinando o Livro de Visitantes e circulando pelo nosso salão.',
      'Lembro a todos que nossa Estante de Artistas, logo à esquerda da Lareira de Pedra, guarda o Códice de Lendas Musicais: lá cada grande mestre da música aparece tanto em seu retrato biográfico histórico quanto em sua forma colecionável em pixel art 16-bit.',
      'Não deixem também de passar pelo balcão para um brinde de Hidromel das Seis Cordas antes de sua próxima jornada musical!',
    ],
    musicalRiddle: 'Dica da Taverna: Pressione [E] próximo a qualquer ponto do salão para interagir.',
    applauseCount: 31,
    pinnedPosition: { rotateDeg: -0.8 },
  },
  {
    id: 'note_midnight_blues',
    title: 'Os Sete Modos do Trovador Errante',
    author: 'Mestre Cedric',
    authorTitle: 'Guardião dos Pergaminhos',
    category: 'desafios',
    dateScroll: 'Noite VII · Meia-Noite Dourada',
    waxSealColor: '#1e4d2b',
    waxSealLabel: 'Selo Esmeralda',
    previewSnippet:
      'Dizem que apenas os verdadeiros mestres conseguem distinguir uma nota sincopada de um acorde desafinado no calor da festa...',
    paragraphs: [
      'Viajei por muitas estalagens e teatros reais, mas nenhum lugar possui a acústica de madeira e pedra desta Musical Tavern.',
      'Deixo aqui um desafio aos novos aventureiros: testem sua percepção no palco alternando entre harmonias perfeitas e dissonâncias. Observe como até a postura de um bom bardo muda diante de uma corda fora de tom!',
      'Em breve, as mesas deste salão receberão os grandes torneios de adivinhação de artistas, melodias e instrumentos.',
    ],
    musicalRiddle: 'Segredo Harmônico: A quinta justa ilumina o salão; o trítono alerta o ouvido.',
    applauseCount: 15,
    pinnedPosition: { rotateDeg: 1.4 },
  },
];

/**
 * Filters bard notes by category ('todas' returns all notes).
 */
export function filterBardNotes(
  notes: BardNote[],
  category: 'todas' | BardNoteCategory
): BardNote[] {
  if (category === 'todas') return notes;
  return notes.filter((n) => n.category === category);
}

/**
 * Increments applause count on a specific bard note deterministically.
 */
export function endorseBardNote(notes: BardNote[], noteId: string): BardNote[] {
  return notes.map((note) =>
    note.id === noteId
      ? { ...note, applauseCount: note.applauseCount + 1 }
      : note
  );
}

/**
 * Validates and creates a new bard note pinned by the current player.
 */
export function createBardNote(
  existingNotes: BardNote[],
  authorName: string,
  title: string,
  bodyText: string,
  musicalRiddle: string,
  category: BardNoteCategory = 'baladas'
): { success: boolean; error?: string; newNote?: BardNote; updatedNotes?: BardNote[] } {
  const cleanTitle = title.trim();
  const cleanBody = bodyText.trim();
  const cleanRiddle = musicalRiddle.trim() || 'Harmonia livre composta no salão da taverna.';

  if (cleanTitle.length < 4) {
    return {
      success: false,
      error: 'Inscreva um título com pelo menos 4 caracteres para o seu pergaminho.',
    };
  }
  if (cleanBody.length < 10) {
    return {
      success: false,
      error: 'Escreva uma mensagem ou verso com pelo menos 10 caracteres.',
    };
  }

  const sealMap: Record<BardNoteCategory, { color: string; label: string }> = {
    desafios: { color: '#6b1d2f', label: 'Selo Carmesim' },
    baladas: { color: '#283c5c', label: 'Selo Safira' },
    rumores: { color: '#9e6b1b', label: 'Selo de Ouro Antigo' },
  };

  const seal = sealMap[category];
  const newNote: BardNote = {
    id: `note_custom_${existingNotes.length + 1}`,
    title: cleanTitle.slice(0, 60),
    author: authorName.trim() || 'Bardo Viajante',
    authorTitle: 'Aventureiro da Taverna',
    category,
    dateScroll: 'Inscrito Agora · Pergaminho Fresco',
    waxSealColor: seal.color,
    waxSealLabel: seal.label,
    previewSnippet:
      cleanBody.length > 110 ? `${cleanBody.slice(0, 107)}...` : cleanBody,
    paragraphs: cleanBody.split(/\n+/).filter((p) => p.trim().length > 0),
    musicalRiddle: cleanRiddle.slice(0, 90),
    applauseCount: 1,
    pinnedPosition: { rotateDeg: existingNotes.length % 2 === 0 ? -1.0 : 1.0 },
  };

  return {
    success: true,
    newNote,
    updatedNotes: [newNote, ...existingNotes],
  };
}
