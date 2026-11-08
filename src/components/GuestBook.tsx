import React, { useState } from 'react';
import {
  Feather,
  KeyRound,
  UserPlus,
  Compass,
  BookOpen,
  Sparkles,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AuthMode,
  MusicalAffinity,
  TravelerAccount,
} from '../utils/authLogic';
import { CollectibleArtistPreview } from './CollectibleArtistPreview';

import parchmentTextureUrl from '../assets/images/parchment_page_texture_1794078191137.jpg';
import leatherCoverUrl from '../assets/images/aged_leather_cover_1794078190518.jpg';

interface GuestBookProps {
  isBookOpen: boolean;
  onToggleBook: () => void;
  authMode: AuthMode;
  onSelectAuthMode: (mode: AuthMode) => void;
  currentTraveler: TravelerAccount | null;
  registeredCount: number;
  onLogin: (identifier: string, password: string) => { success: boolean; error?: string };
  onRegister: (
    username: string,
    email: string,
    password: string,
    affinity: MusicalAffinity
  ) => { success: boolean; error?: string };
  onRecover: (identifier: string) => {
    success: boolean;
    message: string;
    hint?: string;
  };
  onContinueAsVisitor: () => void;
  onEnterTavernHall: () => void;
  onSignOut: () => void;
  onUserTyping: () => void;
}

const AFFINITIES: MusicalAffinity[] = [
  'Rock Clássico & Progressivo',
  'Jazz, Blues & Soul',
  'MPB & Folk Acústico',
  'Metal Sinfônico & Épico',
  'Pop, Indie & Alternativo',
];

/**
 * Ornate Brass Corner Bracket SVG for the Aged Leather Book Cover
 */
const BrassCorner: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br' }> = ({ position }) => {
  const rotateClass =
    position === 'tl'
      ? 'top-0 left-0 rotate-0'
      : position === 'tr'
      ? 'top-0 right-0 rotate-90'
      : position === 'br'
      ? 'bottom-0 right-0 rotate-180'
      : 'bottom-0 left-0 -rotate-90';

  return (
    <svg
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute w-9 h-9 sm:w-11 sm:h-11 z-20 ${rotateClass}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`brassGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7d87c" />
          <stop offset="50%" stopColor="#c59b27" />
          <stop offset="100%" stopColor="#705012" />
        </linearGradient>
      </defs>
      <path
        d="M2 2 L42 2 L34 10 L14 10 C11 10 10 11 10 14 L10 34 L2 42 Z"
        fill={`url(#brassGrad-${position})`}
        stroke="#2a1608"
        strokeWidth="1.5"
      />
      <circle cx="8" cy="8" r="2.2" fill="#3e2723" />
      <circle cx="24" cy="6" r="1.5" fill="#3e2723" />
      <circle cx="6" cy="24" r="1.5" fill="#3e2723" />
      <path
        d="M14 14 Q22 14 22 22 Q14 22 14 14 Z"
        fill="none"
        stroke="#f7d87c"
        strokeWidth="1"
        opacity="0.75"
      />
    </svg>
  );
};

export const GuestBook: React.FC<GuestBookProps> = ({
  isBookOpen,
  onToggleBook,
  authMode,
  onSelectAuthMode,
  currentTraveler,
  registeredCount,
  onLogin,
  onRegister,
  onRecover,
  onContinueAsVisitor,
  onEnterTavernHall,
  onSignOut,
  onUserTyping,
}) => {
  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAffinity, setRegAffinity] = useState<MusicalAffinity>('Rock Clássico & Progressivo');

  // Recover state
  const [recoverId, setRecoverId] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean;
    message: string;
    hint?: string;
  } | null>(null);

  // Feedback & page flip state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const triggerModeSwitch = (targetMode: AuthMode) => {
    setErrorMsg(null);
    setStatusMsg(null);
    setRecoveryResult(null);
    setIsFlipping(true);
    onSelectAuthMode(targetMode);
    window.setTimeout(() => setIsFlipping(false), 180);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    const res = onLogin(loginId, loginPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Falha ao validar assinatura.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    const res = onRegister(regUsername, regEmail, regPassword, regAffinity);
    if (!res.success) {
      setErrorMsg(res.error || 'Não foi possível inscrever a conta.');
    }
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = onRecover(recoverId);
    setRecoveryResult(res);
  };

  const fillDemoTraveler = () => {
    setLoginId('Aldous_Vane');
    setLoginPassword('alaude16');
    setErrorMsg(null);
    setStatusMsg('Credenciais do cronista Aldous_Vane preenchidas a bico de pena.');
    onUserTyping();
  };

  // --- CLOSED BOOK COVER VIEW (When user closes the book to inspect the leather cover) ---
  if (!isBookOpen) {
    return (
      <div className="relative mx-auto w-full max-w-[460px] transition-transform duration-200">
        <div
          className="relative rounded-lg border-4 border-[#3e2214] p-6 sm:p-8 shadow-[0_24px_55px_rgba(0,0,0,0.92)] text-center overflow-hidden"
          style={{
            backgroundColor: '#2a150d',
            backgroundImage: `linear-gradient(135deg, rgba(42,21,13,0.78), rgba(74,18,31,0.72)), url(${leatherCoverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <BrassCorner position="tl" />
          <BrassCorner position="tr" />
          <BrassCorner position="bl" />
          <BrassCorner position="br" />

          {/* Gold-foil embossed inner manuscript frame */}
          <div className="relative z-10 rounded border-2 border-[#c59b27]/75 p-5 sm:p-6 bg-[#1b0d08]/65">
            {/* Bespoke SVG Musical Tavern Crest */}
            <svg
              viewBox="0 0 120 84"
              className="mx-auto w-24 h-16 mb-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="42"
                r="34"
                fill="#26130b"
                stroke="#d9a738"
                strokeWidth="2"
              />
              <circle
                cx="60"
                cy="42"
                r="29"
                fill="none"
                stroke="#d9a738"
                strokeWidth="0.8"
                strokeDasharray="3 2"
              />
              <path
                d="M52 54 C44 54 42 42 52 36 C56 33 64 33 68 36 C78 42 76 54 68 54 Z"
                fill="#b87d28"
                stroke="#f7d87c"
                strokeWidth="1.5"
              />
              <circle cx="60" cy="45" r="4.5" fill="#26130b" stroke="#f7d87c" strokeWidth="1" />
              <path d="M60 34 L60 15" stroke="#f7d87c" strokeWidth="3" strokeLinecap="round" />
              <path d="M56 17 L64 17 M56 21 L64 21" stroke="#d9a738" strokeWidth="1.4" />
            </svg>

            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-[#f7d87c] mb-1">
              Musical Tavern
            </h1>
            <p className="font-display text-xs tracking-widest text-[#eadbc8] mb-3">
              O Grande Livro de Visitantes
            </p>
            <p className="text-sm text-[#eadbc8]/90 italic mb-5 leading-relaxed">
              Encadernado em couro envelhecido e folha de ouro. Abra as páginas de pergaminho para assinar sua chegada à taverna.
            </p>

            <button
              type="button"
              data-start="true"
              onClick={onToggleBook}
              className="w-full py-2.5 px-5 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs sm:text-sm font-bold tracking-wider shadow-[0_6px_18px_rgba(0,0,0,0.75)] transition-transform duration-150 active:scale-[0.99] cursor-pointer"
            >
              Abrir Livro de Visitantes
            </button>
          </div>
        </div>

        {/* Fabric Ribbons hanging below closed book */}
        <div className="flex justify-center gap-6 -mt-1 pointer-events-none" aria-hidden="true">
          <div className="w-5 h-9 bg-[#6b1d2f] border-x border-[#c59b27]/50 shadow-lg [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" />
          <div className="w-5 h-7 bg-[#4e342e] border-x border-[#c59b27]/50 shadow-lg [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" />
        </div>
      </div>
    );
  }

  // ============================================================================
  // SEPARATE PAGE 2: ÁREA DE ASSINATURA CONFIRMADA NO LIVRO (SEPARADA DO BEM-VINDO)
  // ============================================================================
  if ((authMode === 'confirmed' || authMode === 'tavern_hall') && currentTraveler) {
    return (
      <div
        data-testid="confirmed-signature-page"
        className="relative mx-auto w-full max-w-[920px] transition-all duration-200"
      >
        <div
          className="relative rounded-xl p-2.5 sm:p-4 border-4 border-[#2b160c] shadow-[0_24px_60px_rgba(0,0,0,0.92),0_0_35px_rgba(217,167,56,0.18)]"
          style={{
            backgroundColor: '#2c170e',
            backgroundImage: `linear-gradient(180deg, rgba(44,23,14,0.82), rgba(28,14,8,0.9)), url(${leatherCoverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <BrassCorner position="tl" />
          <BrassCorner position="tr" />
          <BrassCorner position="bl" />
          <BrassCorner position="br" />

          {/* Metallic Brass Side Clasps */}
          <div
            className="hidden sm:block pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-16 rounded-l border border-[#2a1608] bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#785413] shadow-md z-20"
            aria-hidden="true"
          />
          <div
            className="hidden sm:block pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-16 rounded-r border border-[#2a1608] bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#785413] shadow-md z-20"
            aria-hidden="true"
          />

          <div className="relative rounded-lg border-2 border-[#8c6722]/70 bg-[#dfd0b8] p-1 sm:p-1.5 shadow-inner">
            {authMode === 'confirmed' ? (
              <div className="relative grid grid-cols-1 lg:grid-cols-2 rounded overflow-hidden">
                {/* Center Book Spine Shadow */}
                <div
                  className="hidden lg:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 z-20"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(38,22,12,0) 0%, rgba(38,22,12,0.32) 38%, rgba(22,12,7,0.68) 50%, rgba(38,22,12,0.32) 62%, rgba(38,22,12,0) 100%)',
                  }}
                  aria-hidden="true"
                />

                {/* LEFT PAGE OF CONFIRMATION SPREAD: CERTIFICADO DE ASSINATURA CONFIRMADA */}
                <section
                  aria-label="Assinatura Confirmada no Livro"
                  className="relative p-4 sm:p-6 lg:pr-8 text-[#26160c] border-b-2 lg:border-b-0 lg:border-r border-[#8c6722]/45 flex flex-col justify-between"
                  style={{
                    backgroundColor: '#f2e5ce',
                    backgroundImage: `linear-gradient(135deg, rgba(247,238,220,0.86) 0%, rgba(228,208,176,0.9) 100%), url(${parchmentTextureUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'left center',
                  }}
                >
                  <div className="relative rounded border border-[#8c6722]/60 p-4 flex flex-col justify-between h-full bg-[#f6ecd9]/55">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8c6722]/50 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#6b1d2f] shrink-0" />
                          <h1 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#4a121f]">
                            Assinatura Confirmada no Livro
                          </h1>
                        </div>
                        <span className="font-mono-num text-xs font-bold text-[#6b1d2f] whitespace-nowrap">
                          Registro #{currentTraveler.entryNumber}
                        </span>
                      </div>

                      {/* Traveler's Official Sealed Credential Card */}
                      <div className="rounded border-2 border-[#8c6722]/65 bg-[#ecddc2]/85 p-3.5 mb-3 shadow-inner">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-display font-bold tracking-wider text-[#6b1d2f]">
                              {currentTraveler.isVisitor
                                ? 'Passe de Visitante Acolhido'
                                : 'Viajante Oficial da Taverna'}
                            </div>
                            <div className="font-display text-lg sm:text-xl font-extrabold text-[#24130b] mt-0.5">
                              {currentTraveler.username}
                            </div>
                            <div className="text-xs italic text-[#4e342e]">
                              {currentTraveler.title}
                            </div>
                          </div>

                          {/* Crimson Wax Seal SVG */}
                          <svg
                            viewBox="0 0 44 44"
                            className="w-12 h-12 shrink-0 drop-shadow"
                            aria-hidden="true"
                          >
                            <circle
                              cx="22"
                              cy="22"
                              r="19"
                              fill="#6b1d2f"
                              stroke="#4a121f"
                              strokeWidth="2"
                            />
                            <circle
                              cx="22"
                              cy="22"
                              r="14"
                              fill="none"
                              stroke="#d9a738"
                              strokeWidth="1"
                              strokeDasharray="2 1.5"
                            />
                            <path
                              d="M18 27 L18 15 L28 13 L28 25"
                              fill="none"
                              stroke="#f7d87c"
                              strokeWidth="2"
                            />
                            <circle cx="16.5" cy="27" r="2.5" fill="#f7d87c" />
                            <circle cx="26.5" cy="25" r="2.5" fill="#f7d87c" />
                          </svg>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#8c6722]/35 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] font-display text-[#52321f]">
                              Afinidade Musical
                            </span>
                            <span className="font-semibold text-[#24130b]">
                              {currentTraveler.affinity}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-display text-[#52321f]">
                              Crônica de Entrada
                            </span>
                            <span className="font-mono-num text-[11px] text-[#24130b]">
                              {currentTraveler.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      <CollectibleArtistPreview compact />
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#8c6722]/40 flex items-center justify-between text-[11px] text-[#52321f]">
                      <span>Fólio III · Registro de Viajante</span>
                      <span className="font-mono-num">Lacrado por Barnaby</span>
                    </div>
                  </div>
                </section>

                {/* RIGHT PAGE OF CONFIRMATION SPREAD: PORTAL DE ENTRADA NA TAVERNA */}
                <section
                  aria-label="Passagem para o Salão da Taverna"
                  className="relative p-4 sm:p-6 lg:pl-8 text-[#26160c] flex flex-col justify-between"
                  style={{
                    backgroundColor: '#f4e7d1',
                    backgroundImage: `linear-gradient(225deg, rgba(248,240,224,0.86) 0%, rgba(226,205,172,0.92) 100%), url(${parchmentTextureUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                  }}
                >
                  <div className="relative rounded border border-[#8c6722]/60 p-4 flex flex-col justify-between h-full bg-[#f8efe0]/55">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#8c6722]/45 pb-2.5 mb-3">
                        <span className="font-display text-xs sm:text-sm font-bold tracking-wide text-[#3e2723]">
                          Passagem para o Salão Principal
                        </span>
                        <span className="font-mono-num text-[11px] text-[#52321f]">
                          Fólio IV
                        </span>
                      </div>

                      <div className="my-2 rounded border border-[#8c6722]/50 bg-[#ecddc2]/70 p-4 text-center">
                        {/* Tavern Archway & Lute Crest SVG */}
                        <svg
                          viewBox="0 0 80 64"
                          className="mx-auto w-16 h-14 mb-2"
                          aria-hidden="true"
                        >
                          <path
                            d="M16 58 V28 C16 14 64 14 64 28 V58 Z"
                            fill="#26130b"
                            stroke="#c59b27"
                            strokeWidth="2.2"
                          />
                          <path
                            d="M22 58 V30 C22 20 58 20 58 30 V58"
                            fill="none"
                            stroke="#f7d87c"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <circle cx="40" cy="36" r="10" fill="#6b1d2f" stroke="#d9a738" strokeWidth="1.5" />
                          <path d="M37 40 V30 L45 28 V38" fill="none" stroke="#faf5e8" strokeWidth="1.6" />
                        </svg>

                        <h2 className="font-display text-base sm:text-lg font-extrabold text-[#24130b] mb-1">
                          Saudações, {currentTraveler.username}!
                        </h2>
                        <p className="text-xs sm:text-sm text-[#3e2723] italic leading-relaxed">
                          “Sua assinatura já repousa nas páginas do nosso livro! Atravessando este balcão você encontrará as mesas e os modos de jogo da Taverna Musical.”
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {/* Primary Action CTA: Entrar na Taverna */}
                      <button
                        type="button"
                        data-start="true"
                        onClick={onEnterTavernHall}
                        className="w-full py-3 px-5 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs sm:text-sm font-bold tracking-wider shadow-[0_6px_18px_rgba(74,18,31,0.55)] transition-transform duration-150 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Compass className="w-4 h-4 text-[#f7d87c] shrink-0" />
                        <span>Entrar na Taverna</span>
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={onSignOut}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-[#6b1d2f]/80 bg-[#e6d3b3] hover:bg-[#dcc39b] text-[#4a121f] font-display text-xs font-bold tracking-wide cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                          <span>Trocar Viajante / Voltar ao Login</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* TAVERN HALL PREVIEW WHEN USER CLICKS "ENTRAR NA TAVERNA" */
              <div
                className="relative p-5 sm:p-8 text-[#26160c] rounded"
                style={{
                  backgroundColor: '#f2e5ce',
                  backgroundImage: `linear-gradient(135deg, rgba(247,238,220,0.88) 0%, rgba(226,205,172,0.92) 100%), url(${parchmentTextureUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="rounded border-2 border-[#8c6722]/65 p-5 sm:p-6 bg-[#f8efe0]/60 text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 font-display text-xs font-bold tracking-widest text-[#6b1d2f] mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Salão Principal da Taverna Musical</span>
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#24130b] mb-2">
                    Bem-vindo ao Salão, {currentTraveler.username}!
                  </h1>
                  <p className="text-sm sm:text-base text-[#3e2723] leading-relaxed mb-5">
                    Você atravessou o balcão de recepção com o <strong>Registro #{currentTraveler.entryNumber}</strong>. É neste salão que os modos de jogo musicais, desafios e coleções de artistas serão adicionados nas próximas etapas do projeto.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => triggerModeSwitch('confirmed')}
                      className="py-2.5 px-4 rounded border-2 border-[#c59b27] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap"
                    >
                      Ver Assinatura Confirmada no Livro
                    </button>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="py-2.5 px-4 rounded border border-[#6b1d2f] bg-[#e6d3b3] hover:bg-[#dcc39b] text-[#4a121f] font-display text-xs font-bold tracking-wide cursor-pointer whitespace-nowrap"
                    >
                      Sair para a Tela de Login
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SCREEN 1: OPEN TWO-PAGE GUESTBOOK SPREAD (BEM-VINDO + LOGIN / REGISTRO)
  // ============================================================================
  return (
    <div className="relative mx-auto w-full max-w-[1040px] transition-all duration-200">
      {/* Outer Aged Leather Book Binding Frame */}
      <div
        className="relative rounded-xl p-2.5 sm:p-4 border-4 border-[#2b160c] shadow-[0_24px_60px_rgba(0,0,0,0.92),0_0_35px_rgba(217,167,56,0.14)]"
        style={{
          backgroundColor: '#2c170e',
          backgroundImage: `linear-gradient(180deg, rgba(44,23,14,0.82), rgba(28,14,8,0.9)), url(${leatherCoverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* 4 Ornate Metallic Gold Corners */}
        <BrassCorner position="tl" />
        <BrassCorner position="tr" />
        <BrassCorner position="bl" />
        <BrassCorner position="br" />

        {/* Metallic Brass Side Clasps on Left and Right Edges */}
        <div
          className="hidden sm:block pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-16 rounded-l border border-[#2a1608] bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#785413] shadow-md z-20"
          aria-hidden="true"
        />
        <div
          className="hidden sm:block pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-16 rounded-r border border-[#2a1608] bg-gradient-to-b from-[#f7d87c] via-[#c59b27] to-[#785413] shadow-md z-20"
          aria-hidden="true"
        />

        {/* Layered Page Edges Effect */}
        <div className="relative rounded-lg border-2 border-[#8c6722]/70 bg-[#dfd0b8] p-1 sm:p-1.5 shadow-inner">
          {/* Two-Page Spread Grid */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 rounded overflow-hidden">
            {/* Center Book Spine Shadow & Stitched Binding Cord (Desktop) */}
            <div
              className="hidden lg:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 z-20"
              style={{
                background:
                  'linear-gradient(90deg, rgba(38,22,12,0) 0%, rgba(38,22,12,0.32) 38%, rgba(22,12,7,0.68) 50%, rgba(38,22,12,0.32) 62%, rgba(38,22,12,0) 100%)',
              }}
              aria-hidden="true"
            />

            {/* ================================================================= */}
            {/* LEFT PAGE: PÁGINA DE APRESENTAÇÃO E MANUSCRITO DA TAVERNA         */}
            {/* ================================================================= */}
            <section
              aria-label="Página de Apresentação da Taverna Musical"
              className="relative p-4 sm:p-6 lg:pr-8 text-[#26160c] border-b-2 lg:border-b-0 lg:border-r border-[#8c6722]/45 flex flex-col justify-between"
              style={{
                backgroundColor: '#f2e5ce',
                backgroundImage: `linear-gradient(135deg, rgba(247,238,220,0.84) 0%, rgba(228,208,176,0.88) 100%), url(${parchmentTextureUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'left center',
              }}
            >
              {/* Inner Manuscript Ornamental Rule Frame */}
              <div className="relative rounded border border-[#8c6722]/60 p-3.5 sm:p-4 flex flex-col justify-between h-full bg-[#f6ecd9]/45">
                {/* Top Header & Bespoke SVG Title Emblem */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8c6722]/45 pb-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Bespoke Inline SVG Title Emblem */}
                      <svg
                        viewBox="0 0 56 56"
                        className="w-10 h-10 shrink-0"
                        aria-hidden="true"
                      >
                        <circle
                          cx="28"
                          cy="28"
                          r="25"
                          fill="#4a121f"
                          stroke="#c59b27"
                          strokeWidth="2"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="21"
                          fill="none"
                          stroke="#f7d87c"
                          strokeWidth="0.75"
                          strokeDasharray="2 2"
                        />
                        {/* Medieval Lute & Musical Clef */}
                        <path
                          d="M21 37 C16 33 17 25 23 22 C26 20 30 20 33 22 C39 25 40 33 35 37 C31 40 25 40 21 37 Z"
                          fill="#d9a738"
                          stroke="#26160c"
                          strokeWidth="1.2"
                        />
                        <circle cx="28" cy="30" r="3" fill="#26160c" />
                        <path
                          d="M28 21 L28 9 M25 11 L31 11 M25 14 L31 14"
                          stroke="#faf5e8"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div>
                        <h1
                          className="font-display text-base sm:text-lg font-extrabold tracking-wide text-[#3e1f14] leading-tight"
                          style={{ textWrap: 'balance' }}
                        >
                          Musical Tavern
                        </h1>
                        <p className="font-display text-[11px] font-semibold tracking-wider text-[#6b1d2f]">
                          Crônicas & Livro de Visitantes
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono-num text-[11px] text-[#52321f] whitespace-nowrap shrink-0">
                      <span>Fólio I</span>
                      <span aria-hidden="true"> · </span>
                      <span>{registeredCount} Viajantes</span>
                    </div>
                  </div>

                  {/* Illuminated Manuscript Welcome Prose with Medieval Drop Cap */}
                  <div className="mb-3 text-sm sm:text-[15px] leading-relaxed text-[#2b190e]">
                    <span
                      className="float-left mr-2.5 mt-0.5 px-2 py-0.5 font-display text-2xl sm:text-3xl font-bold text-[#faf5e8] bg-[#6b1d2f] border border-[#c59b27] rounded shadow-sm leading-none"
                      aria-hidden="true"
                    >
                      B
                    </span>
                    <p>
                      em-vindo à <strong>Taverna Musical</strong>, viajante. Lá fora a chuva fria bate nas vidraças, mas aqui dentro o fogo da lareira aquece os alaúdes e os velhos pergaminhos de música.
                    </p>
                    <p className="mt-1.5 text-xs sm:text-[13.5px] text-[#452a19]">
                      Aproxime-se do balcão de Barnaby e inscreva seu nome a bico de pena para explorar nossa enciclopédia interativa de artistas e bandas lendárias.
                    </p>
                  </div>
                </div>

                {/* Dual Visual Representation Preview (Archival Photo + 16-bit Pixel Art) */}
                <div className="my-1">
                  <CollectibleArtistPreview compact />
                </div>

                {/* Footer Marginalia & Quick Demo Inscription Helper */}
                <div className="mt-2.5 pt-2 border-t border-[#8c6722]/40 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4e342e]">
                  <span>
                    Sinta-se em casa · Lareira acesa
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (authMode !== 'login') triggerModeSwitch('login');
                      fillDemoTraveler();
                    }}
                    className="inline-flex items-center gap-1 font-display text-[11px] font-bold text-[#6b1d2f] hover:text-[#4a121f] underline underline-offset-2 cursor-pointer whitespace-nowrap"
                  >
                    <Feather className="w-3 h-3" />
                    <span>Usar Caligrafia de Exemplo (Aldous)</span>
                  </button>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* RIGHT PAGE: PÁGINA DE AUTENTICAÇÃO INTEGRADA AO PERGAMINHO        */}
            {/* ================================================================= */}
            <section
              aria-label="Página de Autenticação e Assinatura"
              className={`relative p-4 sm:p-6 lg:pl-8 text-[#26160c] transition-opacity duration-150 ${
                isFlipping ? 'opacity-60' : 'opacity-100'
              }`}
              style={{
                backgroundColor: '#f4e7d1',
                backgroundImage: `linear-gradient(225deg, rgba(248,240,224,0.85) 0%, rgba(226,205,172,0.9) 100%), url(${parchmentTextureUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'right center',
              }}
            >
              <div className="relative rounded border border-[#8c6722]/60 p-3.5 sm:p-4 flex flex-col justify-between h-full bg-[#f8efe0]/50">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#8c6722]/45 pb-2 mb-3">
                    <div
                      role="tablist"
                      aria-label="Modos do Livro de Visitantes"
                      className="flex items-center gap-1.5 overflow-x-auto"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'login'}
                        onClick={() => triggerModeSwitch('login')}
                        className={`px-2.5 py-1 rounded text-xs font-display font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          authMode === 'login'
                            ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                            : 'text-[#4e342e] hover:bg-[#8c6722]/20'
                        }`}
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'register'}
                        onClick={() => triggerModeSwitch('register')}
                        className={`px-2.5 py-1 rounded text-xs font-display font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          authMode === 'register'
                            ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                            : 'text-[#4e342e] hover:bg-[#8c6722]/20'
                        }`}
                      >
                        Criar Conta
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMode === 'recover'}
                        onClick={() => triggerModeSwitch('recover')}
                        className={`px-2.5 py-1 rounded text-xs font-display font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          authMode === 'recover'
                            ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                            : 'text-[#4e342e] hover:bg-[#8c6722]/20'
                        }`}
                      >
                        Recuperar Senha
                      </button>
                    </div>

                    <span className="hidden sm:inline font-mono-num text-[11px] text-[#52321f] whitespace-nowrap shrink-0">
                      Fólio II
                    </span>
                  </div>

                  {/* Error or Status Calligraphic Banner */}
                  {errorMsg && (
                    <div
                      role="alert"
                      className="mb-3 flex items-start gap-2 rounded border border-[#8c2b40] bg-[#6b1d2f]/15 px-3 py-2 text-xs text-[#591121]"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#6b1d2f]" />
                      <span className="font-medium leading-snug">{errorMsg}</span>
                    </div>
                  )}

                  {statusMsg && !errorMsg && (
                    <div
                      role="status"
                      className="mb-3 flex items-start gap-2 rounded border border-[#8c6722] bg-[#d9a738]/20 px-3 py-2 text-xs text-[#3e2723]"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#6b1d2f]" />
                      <span className="font-medium leading-snug">{statusMsg}</span>
                    </div>
                  )}

                  {/* ------------------------------------------------------- */}
                  {/* FORM 1: ENTRAR (LOGIN)                                  */}
                  {/* ------------------------------------------------------- */}
                  {authMode === 'login' && (
                    <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
                      <div>
                        <label
                          htmlFor="tavern-login-id"
                          className="block font-display text-xs font-bold tracking-wide text-[#3e2723] mb-1"
                        >
                          Nome de Usuário ou Correio
                        </label>
                        <div className="relative">
                          <input
                            id="tavern-login-id"
                            type="text"
                            value={loginId}
                            onChange={(e) => {
                              setLoginId(e.target.value);
                              onUserTyping();
                            }}
                            placeholder="Ex.: Aldous_Vane ou aldous@tavernamusical.com"
                            className="manuscript-input w-full px-3 py-2 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm font-medium focus:outline-none focus:border-[#6b1d2f] focus:ring-1 focus:ring-[#6b1d2f]"
                          />
                          <Feather className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-[#8c6722]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="tavern-login-pass"
                            className="block font-display text-xs font-bold tracking-wide text-[#3e2723]"
                          >
                            Senha (Palavra-Passe)
                          </label>
                          <button
                            type="button"
                            onClick={() => triggerModeSwitch('recover')}
                            className="text-xs font-semibold text-[#6b1d2f] hover:underline cursor-pointer"
                          >
                            Recuperar senha?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="tavern-login-pass"
                            type="password"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              onUserTyping();
                            }}
                            placeholder="Inscreva sua palavra-passe secreta"
                            className="manuscript-input w-full px-3 py-2 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm font-medium focus:outline-none focus:border-[#6b1d2f] focus:ring-1 focus:ring-[#6b1d2f]"
                          />
                          <KeyRound className="pointer-events-none absolute right-2.5 top-2.5 w-4 h-4 text-[#8c6722]" />
                        </div>
                      </div>

                      <div className="pt-1 space-y-2">
                        <button
                          type="submit"
                          data-start="true"
                          className="w-full py-2.5 px-4 rounded border-2 border-[#c59b27] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs sm:text-sm font-bold tracking-wider shadow-[0_4px_12px_rgba(74,18,31,0.45)] transition-transform duration-150 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Feather className="w-4 h-4 text-[#f7d87c]" />
                          <span>Assinar no Livro</span>
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => triggerModeSwitch('register')}
                            className="py-1.5 px-3 rounded border border-[#8c6722]/80 bg-[#e6d3b3]/80 hover:bg-[#dcc39b] text-[#3e2723] font-display text-xs font-bold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-[#6b1d2f]" />
                            <span>Criar Conta</span>
                          </button>

                          <button
                            type="button"
                            onClick={onContinueAsVisitor}
                            className="py-1.5 px-3 rounded border border-[#8c6722]/80 bg-[#e6d3b3]/80 hover:bg-[#dcc39b] text-[#3e2723] font-display text-xs font-bold tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <Compass className="w-3.5 h-3.5 text-[#6b1d2f]" />
                            <span>Continuar como Visitante</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* ------------------------------------------------------- */}
                  {/* FORM 2: CRIAR CONTA (REGISTER)                          */}
                  {/* ------------------------------------------------------- */}
                  {authMode === 'register' && (
                    <form onSubmit={handleRegisterSubmit} noValidate className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor="tavern-reg-user"
                            className="block font-display text-[11px] font-bold tracking-wide text-[#3e2723] mb-0.5"
                          >
                            Nome de Usuário
                          </label>
                          <input
                            id="tavern-reg-user"
                            type="text"
                            value={regUsername}
                            onChange={(e) => {
                              setRegUsername(e.target.value);
                              onUserTyping();
                            }}
                            placeholder="Ex.: Bardo_Solar"
                            className="manuscript-input w-full px-2.5 py-1.5 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm focus:outline-none focus:border-[#6b1d2f]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="tavern-reg-email"
                            className="block font-display text-[11px] font-bold tracking-wide text-[#3e2723] mb-0.5"
                          >
                            Correio (E-mail)
                          </label>
                          <input
                            id="tavern-reg-email"
                            type="email"
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              onUserTyping();
                            }}
                            placeholder="bardo@reino.com"
                            className="manuscript-input w-full px-2.5 py-1.5 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm focus:outline-none focus:border-[#6b1d2f]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor="tavern-reg-pass"
                            className="block font-display text-[11px] font-bold tracking-wide text-[#3e2723] mb-0.5"
                          >
                            Nova Senha
                          </label>
                          <input
                            id="tavern-reg-pass"
                            type="password"
                            value={regPassword}
                            onChange={(e) => {
                              setRegPassword(e.target.value);
                              onUserTyping();
                            }}
                            placeholder="Mínimo 5 caracteres"
                            className="manuscript-input w-full px-2.5 py-1.5 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm focus:outline-none focus:border-[#6b1d2f]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="tavern-reg-affinity"
                            className="block font-display text-[11px] font-bold tracking-wide text-[#3e2723] mb-0.5"
                          >
                            Afinidade Musical
                          </label>
                          <select
                            id="tavern-reg-affinity"
                            value={regAffinity}
                            onChange={(e) =>
                              setRegAffinity(e.target.value as MusicalAffinity)
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-[#8c6722]/75 bg-[#ecddc2]/90 text-[#24130b] text-xs font-medium focus:outline-none focus:border-[#6b1d2f]"
                          >
                            {AFFINITIES.map((aff) => (
                              <option key={aff} value={aff}>
                                {aff}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 px-4 rounded border-2 border-[#c59b27] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs font-bold tracking-wider shadow cursor-pointer whitespace-nowrap"
                        >
                          Registrar no Livro
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerModeSwitch('login')}
                          className="py-2 px-3 rounded border border-[#8c6722]/80 bg-[#e6d3b3]/80 hover:bg-[#dcc39b] text-[#3e2723] font-display text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Voltar ao Login
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ------------------------------------------------------- */}
                  {/* FORM 3: RECUPERAR SENHA (RECOVER)                       */}
                  {/* ------------------------------------------------------- */}
                  {authMode === 'recover' && (
                    <form onSubmit={handleRecoverSubmit} noValidate className="space-y-3">
                      <p className="text-xs sm:text-sm text-[#3e2723] leading-relaxed">
                        Informe seu nome de usuário ou correio registrado. Barnaby consultará os arquivos da taverna para restaurar seu selo de acesso.
                      </p>

                      <div>
                        <label
                          htmlFor="tavern-recover-id"
                          className="block font-display text-xs font-bold tracking-wide text-[#3e2723] mb-1"
                        >
                          Nome de Usuário ou Correio
                        </label>
                        <input
                          id="tavern-recover-id"
                          type="text"
                          value={recoverId}
                          onChange={(e) => {
                            setRecoverId(e.target.value);
                            onUserTyping();
                          }}
                          placeholder="Ex.: Aldous_Vane ou helena@tavernamusical.com"
                          className="manuscript-input w-full px-3 py-2 rounded border border-[#8c6722]/75 bg-[#ecddc2]/85 text-[#24130b] placeholder-[#6e5239]/70 text-sm focus:outline-none focus:border-[#6b1d2f]"
                        />
                      </div>

                      {recoveryResult && (
                        <div
                          role="status"
                          className={`p-2.5 rounded border text-xs ${
                            recoveryResult.success
                              ? 'border-[#52321f] bg-[#e6d4b5] text-[#24130b]'
                              : 'border-[#8c2b40] bg-[#6b1d2f]/15 text-[#591121]'
                          }`}
                        >
                          <p className="font-semibold">{recoveryResult.message}</p>
                          {recoveryResult.hint && (
                            <p className="mt-1 font-mono-num text-[11px] text-[#6b1d2f]">
                              Pista do Arquivo: {recoveryResult.hint}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 px-4 rounded border-2 border-[#c59b27] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs font-bold tracking-wider shadow cursor-pointer whitespace-nowrap"
                        >
                          Localizar Registro
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerModeSwitch('login')}
                          className="py-2 px-3 rounded border border-[#8c6722]/80 bg-[#e6d3b3]/80 hover:bg-[#dcc39b] text-[#3e2723] font-display text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Voltar ao Login
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Bottom Manuscript Seal & Keyboard Hint */}
                <div className="mt-3 pt-2 border-t border-[#8c6722]/40 flex items-center justify-between text-[11px] text-[#52321f]">
                  <span>Autenticação integrada ao Livro de Visitantes</span>
                  <span className="font-mono-num">Selo Real · Taverna Musical</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Wine-Red & Espresso-Brown Fabric Ribbon Bookmarks hanging from the bottom spine */}
      <div className="flex justify-center gap-4 -mt-1 z-30 relative">
        <button
          type="button"
          onClick={() => triggerModeSwitch('login')}
          title="Marcador de Tecido Vinho · Ir para Assinatura de Entrada"
          className="group flex flex-col items-center focus:outline-none cursor-pointer"
        >
          <div className="w-6 h-10 bg-[#6b1d2f] group-hover:h-11 transition-all border-x border-[#d9a738]/60 shadow-[0_6px_14px_rgba(0,0,0,0.85)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" />
        </button>
        <button
          type="button"
          onClick={() => triggerModeSwitch('register')}
          title="Marcador de Tecido Marrom · Ir para Novo Registro"
          className="group flex flex-col items-center focus:outline-none cursor-pointer"
        >
          <div className="w-6 h-8 bg-[#4e342e] group-hover:h-10 transition-all border-x border-[#d9a738]/50 shadow-[0_6px_14px_rgba(0,0,0,0.85)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" />
        </button>
      </div>
    </div>
  );
};

