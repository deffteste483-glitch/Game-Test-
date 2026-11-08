import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Sparkles,
  Feather,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Music,
  X,
  PlusCircle,
  Check,
} from 'lucide-react';
import {
  BardNote,
  BardNoteCategory,
  INITIAL_BARD_NOTES,
  createBardNote,
  endorseBardNote,
  filterBardNotes,
} from '../utils/noticeBoardLogic';

import parchmentTextureUrl from '../assets/images/parchment_page_texture_1794078191137.jpg';
import leatherCoverUrl from '../assets/images/aged_leather_cover_1794078190518.jpg';

interface MuralDeAvisosProps {
  adventurerName: string;
  onClose: () => void;
  onPlaySoundEffect: (type: 'flip' | 'quill' | 'fanfare') => void;
  onStatusUpdate?: (message: string) => void;
}

const NOTICE_BOARD_STORAGE_KEY = 'musical_tavern_notice_board_v1';

/**
 * Componente 'Mural de Avisos' dentro do TavernHallScene.
 * Permite ao jogador explorar notas pregadas por outros bardos da taverna,
 * lê-las com efeito visual de pergaminho estendido (unrolled scroll com rolos de madeira,
 * lacre de cera e iluminura), aplaudir registros e pregar sua própria nota.
 */
export const MuralDeAvisos: React.FC<MuralDeAvisosProps> = ({
  adventurerName,
  onClose,
  onPlaySoundEffect,
  onStatusUpdate,
}) => {
  const [notes, setNotes] = useState<BardNote[]>(() => {
    try {
      const saved = localStorage.getItem(NOTICE_BOARD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_BARD_NOTES;
  });

  const [activeCategory, setActiveCategory] = useState<'todas' | BardNoteCategory>('todas');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(INITIAL_BARD_NOTES[0].id);
  const [isScrollExtended, setIsScrollExtended] = useState<boolean>(true);
  const [unrollTriggerKey, setUnrollTriggerKey] = useState<number>(0);
  const [endorsedIds, setEndorsedIds] = useState<Set<string>>(new Set());

  // Compose new note state
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<BardNoteCategory>('baladas');
  const [newBody, setNewBody] = useState<string>('');
  const [newRiddle, setNewRiddle] = useState<string>('');
  const [composeError, setComposeError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(NOTICE_BOARD_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  const filteredNotes = filterBardNotes(notes, activeCategory);
  const selectedNote =
    filteredNotes.find((n) => n.id === selectedNoteId) ||
    filteredNotes[0] ||
    notes[0];

  const handleSelectNote = (note: BardNote) => {
    onPlaySoundEffect('flip');
    setSelectedNoteId(note.id);
    setIsComposing(false);
    setIsScrollExtended(true);
    setUnrollTriggerKey((prev) => prev + 1);
    onStatusUpdate?.(`Pergaminho estendido: “${note.title}” por ${note.author}.`);
  };

  const handleToggleExtendScroll = () => {
    onPlaySoundEffect('flip');
    setIsScrollExtended((prev) => !prev);
  };

  const handleEndorseNote = (note: BardNote) => {
    if (endorsedIds.has(note.id)) return;
    onPlaySoundEffect('fanfare');
    const updated = endorseBardNote(notes, note.id);
    setNotes(updated);
    setEndorsedIds((prev) => new Set(prev).add(note.id));
    onStatusUpdate?.(
      `${adventurerName} deixou um Selo de Aprovação na nota de ${note.author}!`
    );
  };

  const handlePinNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createBardNote(
      notes,
      adventurerName,
      newTitle,
      newBody,
      newRiddle,
      newCategory
    );
    if (!res.success || !res.newNote || !res.updatedNotes) {
      onPlaySoundEffect('quill');
      setComposeError(res.error || 'Preencha os campos do pergaminho.');
      return;
    }

    onPlaySoundEffect('fanfare');
    setNotes(res.updatedNotes);
    setActiveCategory('todas');
    setSelectedNoteId(res.newNote.id);
    setIsComposing(false);
    setIsScrollExtended(true);
    setNewTitle('');
    setNewBody('');
    setNewRiddle('');
    setComposeError(null);
    onStatusUpdate?.(
      `${adventurerName} pregou um novo pergaminho no Mural de Avisos: “${res.newNote.title}”!`
    );
  };

  const currentIdx = filteredNotes.findIndex((n) => n.id === selectedNote?.id);
  const handlePrevNext = (dir: -1 | 1) => {
    if (filteredNotes.length <= 1) return;
    const nextIdx = (currentIdx + dir + filteredNotes.length) % filteredNotes.length;
    handleSelectNote(filteredNotes[nextIdx]);
  };

  return (
    <div
      data-testid="mural-de-avisos-modal"
      role="dialog"
      aria-label="Mural de Avisos da Taverna Musical"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-2 sm:inset-3 z-30 flex flex-col rounded-xl border-2 border-[#d9a738] shadow-[0_18px_50px_rgba(0,0,0,0.96)] overflow-hidden"
      style={{
        backgroundColor: '#22120a',
        backgroundImage: `linear-gradient(180deg, rgba(36,19,11,0.94), rgba(22,11,6,0.98)), url(${leatherCoverUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. HEADER BAR OF THE WOODEN NOTICE BOARD */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b-2 border-[#8c6722]/70 bg-[#180c06]/95 shrink-0">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#f7d87c] shrink-0" />
          <div>
            <h2 className="font-display text-xs sm:text-sm font-extrabold tracking-wider text-[#f7d87c]">
              Mural de Avisos & Crônicas dos Bardos
            </h2>
            <p className="text-[10px] text-[#dfc9ad]/80 hidden sm:block">
              Clique em uma nota pregada na madeira para desenrolar o pergaminho estendido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="btn-compose-bard-note"
            onClick={() => {
              onPlaySoundEffect('quill');
              setIsComposing((prev) => !prev);
              setComposeError(null);
            }}
            className={`px-2.5 py-1 rounded border text-[11px] font-display font-bold tracking-wide cursor-pointer flex items-center gap-1 transition-colors ${
              isComposing
                ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                : 'border-[#c59b27]/80 bg-[#2b170e] text-[#f7d87c] hover:bg-[#3d2214]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isComposing ? 'Ver Pergaminho' : 'Deixar Nota no Mural'}</span>
          </button>

          <button
            type="button"
            data-testid="close-mural-btn"
            aria-label="Fechar Mural de Avisos"
            onClick={onClose}
            className="p-1 rounded border border-[#9e7b1c]/70 bg-[#2b170e] hover:border-[#f7d87c] text-[#f4ebd9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN BOARD + EXTENDED PARCHMENT SCROLL VIEW */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT COLUMN (5 cols): PINNED NOTES ON THE WOODEN MURAL */}
        <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r-2 border-[#8c6722]/60 bg-[#1e1009]/90 p-2 sm:p-2.5 overflow-y-auto">
          {/* Category Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filtrar Notas do Mural"
            className="flex flex-wrap gap-1 mb-2 pb-1.5 border-b border-[#8c6722]/40 shrink-0"
          >
            {(
              [
                { id: 'todas', label: `Todas (${notes.length})` },
                { id: 'desafios', label: 'Missões & Desafios' },
                { id: 'baladas', label: 'Baladas & Conquistas' },
                { id: 'rumores', label: 'Comunicados & Novidades' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                onClick={() => {
                  onPlaySoundEffect('quill');
                  setActiveCategory(tab.id);
                }}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-display font-bold cursor-pointer transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-[#6b1d2f] text-[#faf5e8] border border-[#f7d87c]'
                    : 'bg-[#2b170e] text-[#dfc9ad] border border-[#8c6722]/40 hover:border-[#d9a738]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Pinned Bard Notes List */}
          <div className="space-y-1.5">
            {filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id && !isComposing;
              return (
                <button
                  key={note.id}
                  type="button"
                  data-testid={`bard-note-card-${note.id}`}
                  onClick={() => handleSelectNote(note)}
                  className={`relative w-full text-left p-2 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#f7d87c] bg-[#f3e6cf] text-[#24130b] shadow-[0_4px_14px_rgba(0,0,0,0.8)]'
                      : 'border-[#8c6722]/60 bg-[#e6d3b3]/90 hover:bg-[#f3e6cf] text-[#2c170e]'
                  }`}
                >
                  {/* Brass Pin Tack at Top Center */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#d9a738] border border-[#24130b] shadow"
                  />

                  <div className="flex items-start justify-between gap-1.5 mb-0.5">
                    <span className="font-display text-[11px] font-extrabold text-[#4a121f] leading-snug">
                      {note.title}
                    </span>
                    {/* Wax Seal Badge */}
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-display font-bold text-[#faf5e8] shadow-sm"
                      style={{ backgroundColor: note.waxSealColor }}
                    >
                      {note.waxSealLabel}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#3e2723] line-clamp-1 italic mb-1">
                    “{note.previewSnippet}”
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-display font-semibold text-[#5d4037] border-t border-[#8c6722]/30 pt-0.5">
                    <span>Por {note.author}</span>
                    <span className="text-[#6b1d2f] font-bold">
                      ★ {note.applauseCount} Brindes
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): EXTENDED UNROLLED PARCHMENT SCROLL EFFECT */}
        <div className="lg:col-span-7 flex flex-col justify-center p-2 sm:p-3 bg-[#140b06]/90 overflow-y-auto">
          {isComposing ? (
            /* COMPOSE NEW BARD NOTE FORM ON PARCHMENT */
            <form
              onSubmit={handlePinNewNote}
              data-testid="compose-bard-note-form"
              className="rounded-lg border-2 border-[#c59b27] p-3 text-[#24130b] shadow-xl space-y-2"
              style={{
                backgroundColor: '#f3e6cf',
                backgroundImage: `linear-gradient(135deg, rgba(248,240,224,0.92), rgba(226,205,172,0.95)), url(${parchmentTextureUrl})`,
                backgroundSize: 'cover',
              }}
            >
              <div className="flex items-center justify-between border-b border-[#8c6722]/50 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Feather className="w-4 h-4 text-[#6b1d2f]" />
                  <h3 className="font-display text-xs sm:text-sm font-extrabold text-[#4a121f]">
                    Escrever Novo Pergaminho para o Mural
                  </h3>
                </div>
                <span className="text-[11px] font-display font-semibold text-[#5d4037]">
                  Autor: {adventurerName}
                </span>
              </div>

              {composeError && (
                <div
                  role="alert"
                  className="p-1.5 rounded border border-[#6b1d2f] bg-[#6b1d2f]/15 text-xs font-semibold text-[#4a121f]"
                >
                  {composeError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block font-display text-[11px] font-bold text-[#3e2723] mb-0.5">
                    Título da Nota ou Balada
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex.: O Segredo do Alaúde Dourado"
                    className="manuscript-input w-full px-2.5 py-1 rounded border border-[#8c6722] bg-[#ecddc2] text-xs font-bold text-[#24130b]"
                  />
                </div>
                <div>
                  <label className="block font-display text-[11px] font-bold text-[#3e2723] mb-0.5">
                    Selo & Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BardNoteCategory)}
                    className="manuscript-input w-full px-2 py-1 rounded border border-[#8c6722] bg-[#ecddc2] text-xs font-bold text-[#24130b]"
                  >
                    <option value="baladas">Baladas & Duetos</option>
                    <option value="desafios">Desafios Musicais</option>
                    <option value="rumores">Rumores da Taverna</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-display text-[11px] font-bold text-[#3e2723] mb-0.5">
                  Mensagem no Pergaminho
                </label>
                <textarea
                  rows={2}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Deixe seus versos, dicas musicais ou convites para os próximos bardos da taverna..."
                  className="manuscript-input w-full px-2.5 py-1 rounded border border-[#8c6722] bg-[#ecddc2] text-xs text-[#24130b]"
                />
              </div>

              <div>
                <label className="block font-display text-[11px] font-bold text-[#3e2723] mb-0.5">
                  Cadência ou Pista Musical (Opcional)
                </label>
                <input
                  type="text"
                  value={newRiddle}
                  onChange={(e) => setNewRiddle(e.target.value)}
                  placeholder="Ex.: Compasso 3/4 · Acorde de Mi Menor"
                  className="manuscript-input w-full px-2.5 py-1 rounded border border-[#8c6722] bg-[#ecddc2] text-xs text-[#24130b]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3 py-1 rounded border border-[#8c6722] bg-[#e6d3b3] text-xs font-display font-bold text-[#3e2723] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="submit-bard-note-btn"
                  className="px-3.5 py-1 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-bold text-[#faf5e8] cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Feather className="w-3.5 h-3.5 text-[#f7d87c]" />
                  <span>Lacrar & Pregar no Mural</span>
                </button>
              </div>
            </form>
          ) : (
            /* EXTENDED PARCHMENT SCROLL READER (EFEITO DE PERGAMINHO ESTENDIDO) */
            selectedNote && (
              <div
                key={`${selectedNote.id}_${unrollTriggerKey}`}
                data-testid="extended-parchment-scroll"
                className="flex flex-col items-center w-full"
              >
                {/* TOP TURNED WOODEN SCROLL ROLLER */}
                <div className="relative w-full max-w-[560px] flex items-center justify-center z-10">
                  <div className="w-3 h-4 rounded-l bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#7a5914] border border-[#24130b]" />
                  <div className="flex-1 h-3.5 bg-gradient-to-b from-[#6e4226] via-[#472816] to-[#24130b] border-y-2 border-[#180c06] shadow-[0_4px_10px_rgba(0,0,0,0.85)] flex items-center justify-between px-4">
                    <span className="w-8 h-1 rounded bg-[#d9a738]/60" />
                    <span className="font-display text-[9px] tracking-widest uppercase text-[#f7d87c]/90">
                      Pergaminho Estendido dos Bardos
                    </span>
                    <span className="w-8 h-1 rounded bg-[#d9a738]/60" />
                  </div>
                  <div className="w-3 h-4 rounded-r bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#7a5914] border border-[#24130b]" />
                </div>

                {/* UNROLLED PARCHMENT SHEET BODY */}
                <div
                  className={`relative w-[96%] max-w-[540px] border-x-4 border-[#8c6722] text-[#24130b] shadow-[0_12px_28px_rgba(0,0,0,0.9)] transition-all duration-300 overflow-hidden ${
                    isScrollExtended
                      ? 'max-h-[345px] py-2 px-3 sm:px-4 opacity-100'
                      : 'max-h-[105px] py-2 px-3 sm:px-4 opacity-95'
                  }`}
                  style={{
                    backgroundColor: '#f4e7d0',
                    backgroundImage: `linear-gradient(180deg, rgba(44,23,14,0.16) 0%, rgba(248,240,224,0.9) 12%, rgba(235,218,188,0.94) 88%, rgba(44,23,14,0.18) 100%), url(${parchmentTextureUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Decorative Manuscript Inner Border */}
                  <div className="border border-[#8c6722]/55 p-2 sm:p-2.5 rounded-sm bg-[#faf3e6]/55">
                    {/* Scroll Header & Wax Seal */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#8c6722]/50 pb-1.5 mb-1.5">
                      <div>
                        <span className="block font-display text-[9px] font-bold uppercase tracking-wider text-[#6b1d2f]">
                          {selectedNote.dateScroll}
                        </span>
                        <h3
                          data-testid="extended-scroll-title"
                          className="font-display text-xs sm:text-sm font-extrabold text-[#24130b]"
                        >
                          {selectedNote.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-[#5d4037]">
                          Inscrito por{' '}
                          <span className="font-bold text-[#3e2723]">
                            {selectedNote.author}
                          </span>{' '}
                          · <span className="italic">{selectedNote.authorTitle}</span>
                        </p>
                      </div>

                      {/* Embossed Wax Seal Stamp */}
                      <div
                        className="shrink-0 w-8 h-8 rounded-full border-2 border-[#f7d87c] flex flex-col items-center justify-center text-center shadow-md"
                        style={{ backgroundColor: selectedNote.waxSealColor }}
                        title={selectedNote.waxSealLabel}
                      >
                        <Feather className="w-3.5 h-3.5 text-[#faf5e8]" />
                      </div>
                    </div>

                    {/* Scroll Content: Extended vs Rolled Summary */}
                    {isScrollExtended ? (
                      <div
                        data-testid="extended-scroll-full-body"
                        className="space-y-1.5 text-xs leading-snug text-[#26160c] max-h-[145px] overflow-y-auto pr-1"
                      >
                        {selectedNote.paragraphs.map((para, index) => (
                          <p
                            key={index}
                            className={
                              index === 0
                                ? 'first-letter:font-display first-letter:text-lg first-letter:font-extrabold first-letter:text-[#6b1d2f] first-letter:mr-1'
                                : ''
                            }
                          >
                            {para}
                          </p>
                        ))}

                        {/* Musical Riddle / Notation Box */}
                        <div className="mt-1.5 p-1.5 rounded border border-[#8c6722]/75 bg-[#e6d3b3]/85 flex items-center gap-2">
                          <Music className="w-3.5 h-3.5 text-[#6b1d2f] shrink-0" />
                          <span className="font-display text-[10px] font-bold text-[#3e2723]">
                            {selectedNote.musicalRiddle}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs italic text-[#3e2723] truncate">
                        “{selectedNote.previewSnippet}” (Pergaminho recolhido — clique em
                        Estender para ler na íntegra)
                      </p>
                    )}

                    {/* Scroll Footer Controls: Extend/Roll Toggle, Applaud & Prev/Next */}
                    <div className="mt-2 pt-1.5 border-t border-[#8c6722]/45 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="toggle-scroll-extend-btn"
                          onClick={handleToggleExtendScroll}
                          className="px-2 py-1 rounded border border-[#8c6722] bg-[#e6d3b3] hover:bg-[#dcc39b] text-[10px] sm:text-[11px] font-display font-bold text-[#24130b] cursor-pointer flex items-center gap-1"
                        >
                          {isScrollExtended ? (
                            <>
                              <Minimize2 className="w-3 h-3 text-[#6b1d2f]" />
                              <span>Enrolar Pergaminho</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="w-3 h-3 text-[#6b1d2f]" />
                              <span>Estender Pergaminho</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          data-testid="endorse-bard-note-btn"
                          onClick={() => handleEndorseNote(selectedNote)}
                          className={`px-2 py-1 rounded border text-[10px] sm:text-[11px] font-display font-bold cursor-pointer flex items-center gap-1 transition-colors ${
                            endorsedIds.has(selectedNote.id)
                              ? 'border-[#8c6722] bg-[#4a121f] text-[#f7d87c]'
                              : 'border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8]'
                          }`}
                        >
                          {endorsedIds.has(selectedNote.id) ? (
                            <Check className="w-3 h-3 text-[#f7d87c]" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-[#f7d87c]" />
                          )}
                          <span>
                            Brindar ({selectedNote.applauseCount})
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Pergaminho Anterior"
                          onClick={() => handlePrevNext(-1)}
                          className="p-1 rounded border border-[#8c6722]/70 bg-[#e6d3b3] hover:bg-[#dcc39b] text-[#24130b] cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num text-[10px] font-bold text-[#4a121f] px-1">
                          {currentIdx + 1}/{filteredNotes.length}
                        </span>
                        <button
                          type="button"
                          aria-label="Próximo Pergaminho"
                          onClick={() => handlePrevNext(1)}
                          className="p-1 rounded border border-[#8c6722]/70 bg-[#e6d3b3] hover:bg-[#dcc39b] text-[#24130b] cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM TURNED WOODEN SCROLL ROLLER + RIBBON SEAL */}
                <div className="relative w-full max-w-[560px] flex items-center justify-center z-10">
                  <div className="w-3 h-4 rounded-l bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#7a5914] border border-[#24130b]" />
                  <div className="flex-1 h-3.5 bg-gradient-to-b from-[#6e4226] via-[#472816] to-[#24130b] border-y-2 border-[#180c06] shadow-[0_6px_12px_rgba(0,0,0,0.9)] flex items-center justify-center">
                    <div className="w-16 h-1 rounded bg-[#d9a738]/70" />
                  </div>
                  <div className="w-3 h-4 rounded-r bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#7a5914] border border-[#24130b]" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
