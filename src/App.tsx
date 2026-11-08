import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  AudioMixerState,
  AuthMode,
  DEFAULT_AUDIO_MIXER,
  INITIAL_TRAVELERS,
  MusicalAffinity,
  TravelerAccount,
  authenticateTraveler,
  createVisitorSession,
  recoverTravelerPassword,
  registerNewTraveler,
} from './utils/authLogic';
import {
  AdventurerAppearance,
  DEFAULT_ADVENTURER,
  sanitizeAdventurerAppearance,
} from './utils/characterLogic';
import { soundEngine, SoundEffectType } from './utils/soundEngine';
import { TavernAmbienceCanvas } from './components/TavernAmbienceCanvas';
import { PixelBartender, MascotMood } from './components/PixelBartender';
import { GuestBook } from './components/GuestBook';
import { SoundMixerPanel } from './components/SoundMixerPanel';
import { CharacterCreatorModal } from './components/CharacterCreatorModal';
import { TavernHallScene } from './components/TavernHallScene';

import tavernBgUrl from './assets/images/tavern_interior_bg_1794078189273.jpg';

const ACCOUNTS_STORAGE_KEY = 'musical_tavern_accounts_v1';
const MIXER_STORAGE_KEY = 'musical_tavern_mixer_v1';
const CHARACTER_STORAGE_KEY = 'musical_tavern_character_v1';

export default function App() {
  // Load persisted accounts or seed with INITIAL_TRAVELERS
  const [accounts, setAccounts] = useState<TravelerAccount[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return INITIAL_TRAVELERS;
  });

  // Load persisted audio mixer state
  const [mixer, setMixer] = useState<AudioMixerState>(() => {
    try {
      const saved = localStorage.getItem(MIXER_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AUDIO_MIXER, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_AUDIO_MIXER;
  });

  // Check ?autostart=1 or ?hall=1 query param
  const [currentTraveler, setCurrentTraveler] = useState<TravelerAccount | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('hall') === '1') {
        return INITIAL_TRAVELERS[0];
      }
    }
    return null;
  });

  // Load persisted adventurer appearance
  const [appearance, setAppearance] = useState<AdventurerAppearance>(() => {
    try {
      const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
      if (saved) {
        return sanitizeAdventurerAppearance(
          JSON.parse(saved),
          currentTraveler?.username || DEFAULT_ADVENTURER.adventurerName
        );
      }
    } catch {
      // ignore
    }
    return {
      ...DEFAULT_ADVENTURER,
      adventurerName: currentTraveler?.username || DEFAULT_ADVENTURER.adventurerName,
    };
  });

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('hall') === '1') return 'tavern_hall';
    }
    return currentTraveler ? 'confirmed' : 'login';
  });
  const [isBookOpen, setIsBookOpen] = useState<boolean>(true);
  const [mascotMood, setMascotMood] = useState<MascotMood>('wave');
  const [mascotSpeech, setMascotSpeech] = useState<string>(
    'Boa noite, viajante! Aproxime-se da lareira e assine nosso Livro de Visitantes.'
  );

  const moodTimeoutRef = useRef<number | null>(null);

  const triggerTemporaryMood = useCallback(
    (mood: MascotMood, speech: string, durationMs = 2800) => {
      if (moodTimeoutRef.current) {
        window.clearTimeout(moodTimeoutRef.current);
      }
      setMascotMood(mood);
      setMascotSpeech(speech);
      moodTimeoutRef.current = window.setTimeout(() => {
        setMascotMood((prev) => (prev === 'celebrate' ? 'celebrate' : 'idle'));
      }, durationMs);
    },
    []
  );

  // Sync body dataset state for game shell contract
  useEffect(() => {
    document.body.dataset.state =
      authMode === 'confirmed' ||
      authMode === 'character_creator' ||
      authMode === 'tavern_hall'
        ? 'playing'
        : 'title';
  }, [authMode]);

  // Initial welcome wave settles to idle breathing after 3.2s
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMascotMood((prev) => (prev === 'wave' ? 'idle' : prev));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, []);

  // Sync mixer with Web Audio engine & localStorage
  useEffect(() => {
    soundEngine.setMixer(mixer);
    try {
      localStorage.setItem(MIXER_STORAGE_KEY, JSON.stringify(mixer));
    } catch {
      // ignore
    }
  }, [mixer]);

  // Auto-save adventurer appearance whenever it changes
  const handleChangeAppearance = (updated: AdventurerAppearance) => {
    const sanitized = sanitizeAdventurerAppearance(
      updated,
      currentTraveler?.username || 'Aventureiro'
    );
    setAppearance(sanitized);
    try {
      localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(sanitized));
      if (currentTraveler) {
        localStorage.setItem(
          `${CHARACTER_STORAGE_KEY}_${currentTraveler.id}`,
          JSON.stringify(sanitized)
        );
      }
    } catch {
      // ignore
    }
  };

  // Load traveler-specific character appearance when traveler changes
  const loadTravelerAppearance = (traveler: TravelerAccount) => {
    try {
      const perUser = localStorage.getItem(`${CHARACTER_STORAGE_KEY}_${traveler.id}`);
      if (perUser) {
        setAppearance(sanitizeAdventurerAppearance(JSON.parse(perUser), traveler.username));
        return;
      }
      const globalSaved = localStorage.getItem(CHARACTER_STORAGE_KEY);
      if (globalSaved) {
        const parsed = JSON.parse(globalSaved);
        setAppearance(
          sanitizeAdventurerAppearance(
            { ...parsed, adventurerName: traveler.username },
            traveler.username
          )
        );
        return;
      }
    } catch {
      // ignore
    }
    setAppearance({
      ...DEFAULT_ADVENTURER,
      adventurerName: traveler.username,
    });
  };

  // Global keyboard shortcuts (M = Mute, Space/Enter when book is closed opens book)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (isInput) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMixer((prev) => ({ ...prev, masterMuted: !prev.masterMuted }));
      } else if (!isBookOpen && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        soundEngine.playPageFlip();
        setIsBookOpen(true);
        triggerTemporaryMood(
          'wave',
          'As páginas de pergaminho estão abertas! Inscreva seu nome com a pena.',
          2500
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isBookOpen, triggerTemporaryMood]);

  const handleToggleBook = () => {
    soundEngine.playPageFlip();
    setIsBookOpen((prev) => {
      const next = !prev;
      if (next) {
        triggerTemporaryMood(
          'wave',
          'O Livro de Visitantes foi aberto sobre o balcão!',
          2400
        );
      } else {
        triggerTemporaryMood(
          'idle',
          'Aprecie o calor da lareira e a capa de couro envelhecido do nosso livro.',
          2400
        );
      }
      return next;
    });
  };

  const handleSelectAuthMode = (mode: AuthMode) => {
    soundEngine.playPageFlip();
    setAuthMode(mode);
    if (mode === 'login') {
      triggerTemporaryMood(
        'curious',
        'Já possui seu nome em nossas crônicas? Assine abaixo para entrar!',
        2400
      );
    } else if (mode === 'register') {
      triggerTemporaryMood(
        'curious',
        'Um novo bardo na taverna! Escolha sua afinidade musical e registre-se.',
        2600
      );
    } else if (mode === 'recover') {
      triggerTemporaryMood(
        'curious',
        'Esqueceu sua palavra-passe? Deixe-me procurar nos pergaminhos antigos...',
        2600
      );
    } else if (mode === 'confirmed') {
      setMascotMood('celebrate');
      setMascotSpeech(
        'Aqui está a página oficial da sua Assinatura Confirmada no Livro!'
      );
    }
  };

  const handleUserTyping = () => {
    soundEngine.playQuillScratch();
    if (mascotMood !== 'curious' && mascotMood !== 'celebrate') {
      triggerTemporaryMood(
        'curious',
        'Bela caligrafia! Continue escrevendo no pergaminho...',
        1800
      );
    }
  };

  const handleLogin = (identifier: string, password: string) => {
    soundEngine.ensureStarted();
    const res = authenticateTraveler(accounts, identifier, password);
    if (!res.success || !res.account) {
      triggerTemporaryMood(
        'curious',
        res.error || 'Hmm, não encontrei esse selo nos registros da taverna.',
        3000
      );
      return { success: false, error: res.error };
    }

    soundEngine.playPageFlip();
    setCurrentTraveler(res.account);
    loadTravelerAppearance(res.account);
    setAuthMode('confirmed');
    soundEngine.playCelebrationFanfare();
    setMascotMood('celebrate');
    setMascotSpeech(
      `Assinatura confirmada, ${res.account.username}! Clique em "Entrar na Taverna" para personalizar seu aventureiro.`
    );
    return { success: true };
  };

  const handleRegister = (
    username: string,
    email: string,
    password: string,
    affinity: MusicalAffinity
  ) => {
    soundEngine.ensureStarted();
    const res = registerNewTraveler(accounts, username, email, password, affinity);
    if (!res.success || !res.account || !res.updatedAccounts) {
      triggerTemporaryMood(
        'curious',
        res.error || 'Verifique os dados inscritos no pergaminho.',
        3000
      );
      return { success: false, error: res.error };
    }

    setAccounts(res.updatedAccounts);
    try {
      localStorage.setItem(
        ACCOUNTS_STORAGE_KEY,
        JSON.stringify(res.updatedAccounts)
      );
    } catch {
      // ignore
    }

    soundEngine.playPageFlip();
    setCurrentTraveler(res.account);
    loadTravelerAppearance(res.account);
    setAuthMode('confirmed');
    soundEngine.playCelebrationFanfare();
    setMascotMood('celebrate');
    setMascotSpeech(
      `Um brinde a ${res.account.username}! Sua assinatura foi confirmada! Clique em "Entrar na Taverna" para criar seu personagem.`
    );
    return { success: true };
  };

  const handleRecover = (identifier: string) => {
    soundEngine.playPageFlip();
    const res = recoverTravelerPassword(accounts, identifier);
    if (res.success) {
      triggerTemporaryMood(
        'wave',
        `Encontrei o registro de ${res.recoveredUsername}! Veja a pista do selo na página.`,
        3500
      );
    } else {
      triggerTemporaryMood('curious', res.message, 3000);
    }
    return res;
  };

  const handleContinueAsVisitor = () => {
    soundEngine.ensureStarted();
    soundEngine.playPageFlip();
    const visitor = createVisitorSession(accounts.length);
    setCurrentTraveler(visitor);
    loadTravelerAppearance(visitor);
    setAuthMode('confirmed');
    soundEngine.playCelebrationFanfare();
    setMascotMood('celebrate');
    setMascotSpeech(
      'Passe de visitante registrado no livro! Clique em "Entrar na Taverna" para personalizar seu aventureiro.'
    );
  };

  // Clicking "Entrar na Taverna" on the confirmed page goes to Character Customization
  const handleEnterTavernFromBook = () => {
    soundEngine.playPageFlip();
    setAuthMode('character_creator');
    triggerTemporaryMood(
      'wave',
      'Personalize seu aventureiro em pixel art 16-bit antes de circular pelo salão da taverna!',
      3400
    );
  };

  // Confirming character in Character Creator enters the Hybrid Tavern Hall
  const handleConfirmCharacterAndEnterHall = () => {
    soundEngine.playCelebrationFanfare();
    setAuthMode('tavern_hall');
    setMascotMood('celebrate');
    setMascotSpeech(
      `Que traje esplêndido, ${appearance.adventurerName}! O salão da Taverna Musical é todo seu!`
    );
  };

  const handleSignOut = () => {
    soundEngine.playPageFlip();
    setCurrentTraveler(null);
    setAuthMode('login');
    triggerTemporaryMood(
      'wave',
      'Voltamos à página de boas-vindas e login do Livro de Visitantes.',
      2600
    );
  };

  const handlePlaySoundEffect = (type: SoundEffectType) => {
    soundEngine.playEffect(type);
  };

  return (
    <div
      className="relative min-h-dvh w-full overflow-x-hidden flex flex-col justify-between bg-[#120a06] text-[#f4ebd9] select-none"
      onClick={() => soundEngine.ensureStarted()}
    >
      {/* 1. FULL-SCREEN COZY MEDIEVAL TAVERN BACKGROUND WITH FALLBACK */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#1a0e08] via-[#26140b] to-[#120a06]">
        <img
          src={tavernBgUrl}
          alt="Interior aconchegante da Taverna Musical com lareira acesa, alaúde, prateleiras de livros antigos e balcão de madeira"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-90"
        />
        {/* Warm Amber & Vignette Scrim for Readability and Cozy Depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 54% 55%, rgba(255,175,65,0.12) 0%, rgba(18,10,6,0.48) 62%, rgba(12,6,4,0.84) 100%)',
          }}
        />
      </div>

      {/* 2. 60FPS ATMOSPHERIC ANIMATION LAYER (Active on Guestbook & Character Creator screens) */}
      {authMode !== 'tavern_hall' && (
        <TavernAmbienceCanvas
          fireplaceActive={mixer.fireplace > 0 && !mixer.masterMuted}
          rainActive={mixer.rain > 0 && !mixer.masterMuted}
        />
      )}

      {/* 3. TOP PERIMETER BAR: DIEGETIC TAVERN PLAQUE & INDEPENDENT SOUND MIXER */}
      <div className="relative z-30 pointer-events-none flex items-center justify-between gap-4 px-3 sm:px-6 pt-2.5 pb-1">
        {/* Left Diegetic Wooden Sign Plaque */}
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1 rounded border border-[#9e7b1c]/75 bg-[#24130b]/95 shadow-[0_6px_18px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#d9a738] shrink-0" aria-hidden="true">
            <path
              d="M6 12.5V3.5L13 2V11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="4.5" cy="12.5" r="2" fill="currentColor" />
            <circle cx="11.5" cy="11" r="2" fill="currentColor" />
          </svg>
          <span className="font-display text-xs sm:text-sm font-bold tracking-wider text-[#f7d87c] whitespace-nowrap">
            Musical Tavern
          </span>
          <span className="hidden md:inline text-[#dfc9ad]/60" aria-hidden="true">
            ·
          </span>
          <span className="hidden md:inline text-xs text-[#eadbc8] whitespace-nowrap">
            {authMode === 'confirmed'
              ? 'Assinatura Confirmada no Livro'
              : authMode === 'character_creator'
              ? 'Personalização de Aventureiro'
              : authMode === 'tavern_hall'
              ? 'Salão Principal da Taverna'
              : 'Entrada & Livro de Visitantes'}
          </span>
        </div>

        {/* Right Multi-Channel Audio Mixer & Book Toggle */}
        <SoundMixerPanel
          mixer={mixer}
          onChangeMixer={setMixer}
          isBookOpen={isBookOpen}
          onToggleBook={handleToggleBook}
          showBookToggle={authMode !== 'tavern_hall' && authMode !== 'character_creator'}
        />
      </div>

      {/* 4. MAIN FOREGROUND STAGE */}
      <main className="relative z-20 flex-1 flex flex-col justify-end px-2 sm:px-5 pb-2 pt-0.5">
        {/* 16-Bit Pixel Art Mascot Standing Behind the Tavern Counter (Hidden during 3/4 Hall Exploration where Barnaby is inside the 2D RPG World) */}
        {authMode !== 'tavern_hall' && (
          <div className="relative z-30 mx-auto mb-1.5">
            <PixelBartender
              mood={mascotMood}
              speechText={mascotSpeech}
              onWaveTrigger={() => {
                soundEngine.ensureStarted();
                triggerTemporaryMood(
                  'wave',
                  'Bem-vindo à Musical Tavern! O fogo está crepitando e o alaúde está afinado!',
                  3000
                );
              }}
            />
          </div>
        )}

        {/* Aged Oak Tavern Counter Surface & Active Stage View */}
        <div
          className={`relative z-20 w-full mx-auto ${
            authMode === 'tavern_hall' ? 'max-w-[1180px]' : 'max-w-[1120px]'
          }`}
        >
          <div
            className={`relative rounded-t-xl border-t-4 border-x-2 border-[#6e452c]/80 shadow-[0_-12px_36px_rgba(0,0,0,0.85)] ${
              authMode === 'tavern_hall'
                ? 'pt-1.5 pb-2 px-1.5 sm:px-3'
                : 'pt-2 sm:pt-3 pb-3 px-2 sm:px-5'
            }`}
            style={{
              background:
                'linear-gradient(180deg, rgba(58,34,20,0.92) 0%, rgba(36,20,11,0.97) 45%, rgba(24,13,7,0.99) 100%)',
            }}
          >
            {/* Counter Decorative Props */}
            <div
              className="hidden xl:flex pointer-events-none absolute -top-9 left-5 items-end gap-2"
              aria-hidden="true"
            >
              <svg viewBox="0 0 40 44" className="w-9 h-10 drop-shadow-lg">
                <rect
                  x="8"
                  y="10"
                  width="20"
                  height="28"
                  rx="2"
                  fill="#4e342e"
                  stroke="#1f120b"
                  strokeWidth="2"
                />
                <path
                  d="M28 15 H34 C36 15 36 31 34 31 H28"
                  fill="none"
                  stroke="#c59b27"
                  strokeWidth="3"
                />
                <rect x="8" y="14" width="20" height="3" fill="#c59b27" />
                <rect x="8" y="30" width="20" height="3" fill="#c59b27" />
                <path d="M7 10 Q13 5 18 9 Q24 5 29 10 Z" fill="#faf5e8" />
              </svg>
            </div>

            <div
              className="hidden xl:flex pointer-events-none absolute -top-10 right-6 items-end"
              aria-hidden="true"
            >
              <svg viewBox="0 0 44 48" className="w-10 h-11 drop-shadow-lg">
                <path
                  d="M12 34 L16 24 H28 L32 34 L35 42 H9 Z"
                  fill="#b8861b"
                  stroke="#24130b"
                  strokeWidth="1.8"
                />
                <path
                  d="M22 25 C25 14 33 6 38 3 C37 11 31 19 24 25 Z"
                  fill="#faf5e8"
                  stroke="#d9a738"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* CONDITIONAL STAGE VIEW: CHARACTER CREATOR vs TAVERN HALL vs GUESTBOOK */}
            {authMode === 'character_creator' && currentTraveler ? (
              <CharacterCreatorModal
                appearance={appearance}
                onChangeAppearance={handleChangeAppearance}
                onConfirmAndEnterHall={handleConfirmCharacterAndEnterHall}
                onBackToConfirmation={() => {
                  soundEngine.playPageFlip();
                  setAuthMode('confirmed');
                }}
                onPlaySoundEffect={handlePlaySoundEffect}
              />
            ) : authMode === 'tavern_hall' && currentTraveler ? (
              <TavernHallScene
                traveler={currentTraveler}
                appearance={appearance}
                mixer={mixer}
                onChangeMixer={setMixer}
                onOpenCharacterCreator={() => {
                  soundEngine.playPageFlip();
                  setAuthMode('character_creator');
                }}
                onBackToConfirmationBook={() => {
                  soundEngine.playPageFlip();
                  setAuthMode('confirmed');
                }}
                onPlaySoundEffect={handlePlaySoundEffect}
              />
            ) : (
              <GuestBook
                isBookOpen={isBookOpen}
                onToggleBook={handleToggleBook}
                authMode={authMode}
                onSelectAuthMode={handleSelectAuthMode}
                currentTraveler={currentTraveler}
                registeredCount={accounts.length}
                onLogin={handleLogin}
                onRegister={handleRegister}
                onRecover={handleRecover}
                onContinueAsVisitor={handleContinueAsVisitor}
                onEnterTavernHall={handleEnterTavernFromBook}
                onSignOut={handleSignOut}
                onUserTyping={handleUserTyping}
              />
            )}

            {/* Single Flat Control-Hint Line in the Bottom Safe Margin */}
            <div className="mt-1.5 text-center text-[10px] sm:text-[11px] text-[#dfc9ad]/80 font-display tracking-wider">
              {authMode === 'tavern_hall'
                ? 'WASD/Joystick ou Clique no Salão · Toque em Objetos, Banquetas ou NPCs · M Silenciar'
                : authMode === 'character_creator'
                ? 'Personalize em Tempo Real · Salvo Automaticamente · M Silenciar Som'
                : 'Clique na pena para assinar · M Silenciar Som · Toque em Barnaby para cumprimentar'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
