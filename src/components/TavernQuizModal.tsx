import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Users,
  UserPlus,
  HelpCircle,
  Send,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Bot,
  BookOpen,
  X,
  ScrollText,
  Music,
} from 'lucide-react';
import {
  DEFAULT_MAX_ATTEMPTS,
  MAX_HINTS_PER_PLAYER,
  MAX_QUIZ_PLAYERS,
  QUIZ_ARTISTS_DB,
  QuizMatchState,
  ROOM_STORAGE_PREFIX,
  TAVERN_BOT_COMPANIONS,
  createQuizMatch,
  executeBotTurn,
  revealNextHintForPlayer,
  startNextQuizRound,
  submitPlayerGuess,
} from '../utils/quizCatalogAndLogic';
import { SoundEffectType } from '../utils/soundEngine';
import { CollectibleArtistPreview } from './CollectibleArtistPreview';

interface TavernQuizModalProps {
  hostPlayerId: string;
  hostPlayerName: string;
  initialMode: 'solo' | 'multiplayer';
  initialTableName: string;
  unlockedArtistIds: string[];
  onRoundCompleted: (targetArtistId: string, didHostSolve: boolean, hostScore: number) => void;
  onPlaySoundEffect: (type: SoundEffectType) => void;
  onStatusUpdate: (msg: string) => void;
  onClose: () => void;
}

interface SeatDraft {
  id: string;
  name: string;
  isBot: boolean;
  color: string;
}

export const TavernQuizModal: React.FC<TavernQuizModalProps> = ({
  hostPlayerId,
  hostPlayerName,
  initialMode,
  initialTableName,
  unlockedArtistIds,
  onRoundCompleted,
  onPlaySoundEffect,
  onStatusUpdate,
  onClose,
}) => {
  const [setupMode, setSetupMode] = useState<'solo' | 'multiplayer'>(initialMode);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('TAV-2048');
  const [customGuestName, setCustomGuestName] = useState<string>('');
  const [additionalSeats, setAdditionalSeats] = useState<SeatDraft[]>(() => [
    {
      id: TAVERN_BOT_COMPANIONS[0].id,
      name: TAVERN_BOT_COMPANIONS[0].name,
      isBot: true,
      color: TAVERN_BOT_COMPANIONS[0].color,
    },
    {
      id: TAVERN_BOT_COMPANIONS[1].id,
      name: TAVERN_BOT_COMPANIONS[1].name,
      isBot: true,
      color: TAVERN_BOT_COMPANIONS[1].color,
    },
    {
      id: TAVERN_BOT_COMPANIONS[2].id,
      name: TAVERN_BOT_COMPANIONS[2].name,
      isBot: true,
      color: TAVERN_BOT_COMPANIONS[2].color,
    },
  ]);

  const [match, setMatch] = useState<QuizMatchState | null>(null);
  const [guessInput, setGuessInput] = useState<string>('');
  const [autoBotPlay, setAutoBotPlay] = useState<boolean>(false);
  const [recordedRoundKey, setRecordedRoundKey] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // BroadcastChannel + localStorage room synchronization for multi-tab multiplayer rooms
  const broadcastMatchState = useCallback((nextMatch: QuizMatchState) => {
    try {
      localStorage.setItem(
        `${ROOM_STORAGE_PREFIX}${nextMatch.roomCode}`,
        JSON.stringify(nextMatch)
      );
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('musical_tavern_quiz_sync');
        channel.postMessage({ type: 'QUIZ_STATE_UPDATE', match: nextMatch });
        channel.close();
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('musical_tavern_quiz_sync');
    channel.onmessage = (ev) => {
      if (
        ev.data?.type === 'QUIZ_STATE_UPDATE' &&
        ev.data?.match &&
        match &&
        ev.data.match.roomCode === match.roomCode
      ) {
        setMatch(ev.data.match);
      }
    };
    return () => {
      channel.close();
    };
  }, [match]);

  // Record host progression when a round finishes
  useEffect(() => {
    if (!match || match.phase !== 'round_finished') return;
    const roundKey = `${match.matchId}_r${match.roundNumber}`;
    if (recordedRoundKey === roundKey) return;

    setRecordedRoundKey(roundKey);
    const hostSeat = match.players.find((p) => p.playerId === hostPlayerId) || match.players[0];
    const didHostSolve = hostSeat?.status === 'solved';
    const hostScore = hostSeat?.scoreEarned || 0;

    onRoundCompleted(match.targetArtistId, Boolean(didHostSolve), hostScore);
    if (didHostSolve) {
      onPlaySoundEffect('fanfare');
    } else {
      onPlaySoundEffect('flip');
    }
  }, [
    match,
    recordedRoundKey,
    hostPlayerId,
    onRoundCompleted,
    onPlaySoundEffect,
  ]);

  // Optional automatic bot turn stepping when autoBotPlay is enabled
  useEffect(() => {
    if (!match || match.phase !== 'active_round' || !autoBotPlay) return;
    const activeSeat = match.players[match.currentTurnIndex];
    if (!activeSeat || !activeSeat.isBot || activeSeat.status !== 'playing') return;

    const timer = window.setTimeout(() => {
      const nextState = executeBotTurn(match);
      setMatch(nextState);
      broadcastMatchState(nextState);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [match, autoBotPlay, broadcastMatchState]);

  const handleStartMatch = (customTargetArtistId?: string) => {
    onPlaySoundEffect('interact');
    // Pick an artist that the player hasn't unlocked yet if available, or cycle through all 8
    const lockedCandidate = QUIZ_ARTISTS_DB.find(
      (a) => !unlockedArtistIds.includes(a.id)
    );
    const nextMatch = createQuizMatch({
      mode: setupMode,
      tableName: initialTableName,
      hostPlayer: { id: hostPlayerId, name: hostPlayerName },
      additionalPlayers: setupMode === 'multiplayer' ? additionalSeats : [],
      targetArtistId:
        customTargetArtistId || lockedCandidate?.id || QUIZ_ARTISTS_DB[0].id,
      roomCode: roomCodeInput.trim().toUpperCase() || 'TAV-2048',
      roundNumber: 1,
    });
    setMatch(nextMatch);
    setGuessInput('');
    setFeedbackBanner({
      type: 'info',
      text:
        setupMode === 'multiplayer'
          ? `Mesa iniciada com ${nextMatch.players.length} jogadores! Todos receberam o mesmo artista secreto, mas cada jogador controla suas próprias dicas e tentativas.`
          : 'Desafio Solo iniciado! Analise a Pista #1 ou revele novas pistas para descobrir o artista secreto.',
    });
    broadcastMatchState(nextMatch);
    onStatusUpdate(
      `${hostPlayerName} iniciou uma partida na ${initialTableName} (${
        setupMode === 'multiplayer'
          ? `${nextMatch.players.length} jogadores por turnos`
          : 'Modo Solo'
      }).`
    );
  };

  const handleFillSeatsPreset = (totalPlayers: number) => {
    onPlaySoundEffect('quill');
    const neededAdditional = Math.max(
      1,
      Math.min(MAX_QUIZ_PLAYERS - 1, totalPlayers - 1)
    );
    const nextSeats: SeatDraft[] = TAVERN_BOT_COMPANIONS.slice(
      0,
      neededAdditional
    ).map((bot) => ({
      id: bot.id,
      name: bot.name,
      isBot: true,
      color: bot.color,
    }));
    setSetupMode('multiplayer');
    setAdditionalSeats(nextSeats);
  };

  const handleAddHumanGuestSeat = () => {
    if (additionalSeats.length >= MAX_QUIZ_PLAYERS - 1) return;
    const trimmed = customGuestName.trim() || `Viajante #${additionalSeats.length + 2}`;
    onPlaySoundEffect('quill');
    setAdditionalSeats((prev) => [
      ...prev,
      {
        id: `guest_${Date.now()}_${prev.length}`,
        name: trimmed,
        isBot: false,
        color: '#294a30',
      },
    ]);
    setCustomGuestName('');
  };

  const handleRemoveSeat = (seatId: string) => {
    onPlaySoundEffect('flip');
    setAdditionalSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const handleRevealHint = () => {
    if (!match || match.phase !== 'active_round') return;
    const activeSeat = match.players[match.currentTurnIndex];
    if (!activeSeat || activeSeat.hintsRevealed >= MAX_HINTS_PER_PLAYER) return;

    onPlaySoundEffect('flip');
    const updated = revealNextHintForPlayer(match, activeSeat.playerId);
    setMatch(updated);
    broadcastMatchState(updated);
    setFeedbackBanner({
      type: 'info',
      text: `${activeSeat.playerName} abriu a Pista #${
        activeSeat.hintsRevealed + 1
      } em seu próprio pergaminho! Os demais jogadores mantêm suas dicas intactas.`,
    });
  };

  const handleSubmitGuess = (customGuess?: string) => {
    if (!match || match.phase !== 'active_round') return;
    const raw = (customGuess ?? guessInput).trim();
    if (!raw) return;

    const activeSeat = match.players[match.currentTurnIndex];
    if (!activeSeat || activeSeat.status !== 'playing') return;

    const updated = submitPlayerGuess(match, activeSeat.playerId, raw);
    const updatedSeat =
      updated.players.find((p) => p.playerId === activeSeat.playerId) || activeSeat;
    const lastGuess =
      updatedSeat.guessHistory[updatedSeat.guessHistory.length - 1];

    if (lastGuess?.isCorrect) {
      onPlaySoundEffect('fanfare');
      setFeedbackBanner({
        type: 'success',
        text: `${activeSeat.playerName} descobriu o artista secreto (+${lastGuess.pointsAwarded} pts)!`,
      });
    } else {
      onPlaySoundEffect('flip');
      const remaining = updatedSeat.maxAttempts - updatedSeat.attemptsUsed;
      setFeedbackBanner({
        type: 'warning',
        text: `Palpite incorreto de ${activeSeat.playerName} ("${raw}"). Restam ${remaining} tentativa(s) individuais para ${activeSeat.playerName}.`,
      });
    }

    setGuessInput('');
    setMatch(updated);
    broadcastMatchState(updated);
  };

  const handleExecuteBotStep = () => {
    if (!match || match.phase !== 'active_round') return;
    const activeSeat = match.players[match.currentTurnIndex];
    if (!activeSeat || !activeSeat.isBot) return;

    onPlaySoundEffect('quill');
    const updated = executeBotTurn(match);
    const updatedBot =
      updated.players.find((p) => p.playerId === activeSeat.playerId) || activeSeat;
    const lastGuess = updatedBot.guessHistory[updatedBot.guessHistory.length - 1];

    if (lastGuess?.isCorrect) {
      setFeedbackBanner({
        type: 'success',
        text: `${activeSeat.playerName} acertou o artista secreto em seu turno (+${lastGuess.pointsAwarded} pts)!`,
      });
    } else if (lastGuess) {
      setFeedbackBanner({
        type: 'info',
        text: `${activeSeat.playerName} usou ${updatedBot.hintsRevealed} dica(s) próprias e arriscou "${lastGuess.guessText}" (${updatedBot.attemptsUsed}/${updatedBot.maxAttempts} tentativas).`,
      });
    }

    setMatch(updated);
    broadcastMatchState(updated);
  };

  const handleNextRound = () => {
    if (!match) return;
    onPlaySoundEffect('interact');
    const next = startNextQuizRound(match);
    setMatch(next);
    setGuessInput('');
    setFeedbackBanner({
      type: 'info',
      text: `Rodada #${next.roundNumber} iniciada! Um novo artista secreto foi sorteado para todos os ${next.players.length} jogadores da mesa.`,
    });
    broadcastMatchState(next);
  };

  const targetArtist = match
    ? QUIZ_ARTISTS_DB.find((a) => a.id === match.targetArtistId) || QUIZ_ARTISTS_DB[0]
    : QUIZ_ARTISTS_DB[0];

  const activeSeat =
    match && match.players[match.currentTurnIndex]
      ? match.players[match.currentTurnIndex]
      : null;

  return (
    <div
      data-testid="tavern-quiz-modal"
      role="dialog"
      aria-label="Desafio Musical da Taverna"
      className="absolute inset-2 sm:inset-3 z-40 rounded-xl border-2 border-[#f7d87c] bg-[#1a0e08]/98 text-[#f4ebd9] p-3 sm:p-4 shadow-[0_22px_60px_rgba(0,0,0,0.96)] flex flex-col justify-between overflow-y-auto"
    >
      {/* TOP HEADER */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#9e7b1c]/55 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-[#f7d87c] bg-[#6b1d2f] flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-[#f7d87c]" />
            </div>
            <div>
              <span className="block font-display text-[10px] uppercase tracking-widest text-[#d9a738]">
                {initialTableName} · Quiz de Artistas & Bandas da Vida Real
              </span>
              <h2 className="font-display text-sm sm:text-base font-extrabold text-[#f7d87c]">
                {match
                  ? `Rodada #${match.roundNumber} · Sala ${match.roomCode} (${match.players.length}/${MAX_QUIZ_PLAYERS} Jogadores)`
                  : 'Preparar Mesa de Desafio Musical (1 a 8 Jogadores)'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {match && (
              <button
                type="button"
                onClick={() => setMatch(null)}
                className="px-2.5 py-1 rounded border border-[#9e7b1c]/70 bg-[#2b170e] hover:border-[#f7d87c] text-[11px] font-display font-bold text-[#eadbc8] cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-[#d9a738]" />
                <span>Configurar Mesa</span>
              </button>
            )}
            <button
              type="button"
              data-testid="close-quiz-modal-btn"
              onClick={onClose}
              className="px-2.5 py-1 rounded border border-[#9e7b1c]/70 bg-[#2b170e] hover:border-[#f7d87c] text-[11px] font-display font-bold text-[#f4ebd9] cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-[#e8833a]" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* 1. LOBBY / SETUP SCREEN */}
        {!match && (
          <div data-testid="quiz-lobby-setup" className="space-y-3">
            <div className="rounded-lg border border-[#d9a738]/60 bg-[#28150c] p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-display text-xs font-bold text-[#f7d87c] block">
                    Escolha a Modalidade da Partida
                  </span>
                  <p className="text-[11px] text-[#dfc9ad]">
                    Todos os jogadores da mesa recebem o mesmo artista secreto, mantendo dicas (1 a 5) e tentativas (até 4) totalmente independentes.
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    data-testid="quiz-mode-solo-btn"
                    onClick={() => {
                      onPlaySoundEffect('quill');
                      setSetupMode('solo');
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-display font-bold cursor-pointer ${
                      setupMode === 'solo'
                        ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                        : 'border-[#9e7b1c]/50 bg-[#1b0e08] text-[#dfc9ad]'
                    }`}
                  >
                    Desafio Solo (1 Jogador)
                  </button>
                  <button
                    type="button"
                    data-testid="quiz-mode-multi-btn"
                    onClick={() => {
                      onPlaySoundEffect('quill');
                      setSetupMode('multiplayer');
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-display font-bold cursor-pointer flex items-center gap-1 ${
                      setupMode === 'multiplayer'
                        ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                        : 'border-[#9e7b1c]/50 bg-[#1b0e08] text-[#dfc9ad]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Mesa em Grupo (2 a 8 Jogadores)</span>
                  </button>
                </div>
              </div>

              {setupMode === 'multiplayer' && (
                <div className="pt-2 border-t border-[#9e7b1c]/35 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[11px] font-bold text-[#f7d87c]">
                        Assentos na Mesa ({1 + additionalSeats.length}/{MAX_QUIZ_PLAYERS}):
                      </span>
                      <button
                        type="button"
                        data-testid="preset-4-players-btn"
                        onClick={() => handleFillSeatsPreset(4)}
                        className="px-2 py-0.5 rounded border border-[#9e7b1c]/60 bg-[#1b0e08] hover:border-[#f7d87c] text-[10px] font-display font-bold text-[#eadbc8] cursor-pointer"
                      >
                        Mesa de 4 Jogadores
                      </button>
                      <button
                        type="button"
                        data-testid="preset-8-players-btn"
                        onClick={() => handleFillSeatsPreset(8)}
                        className="px-2 py-0.5 rounded border border-[#f7d87c] bg-[#362013] hover:bg-[#4e342e] text-[10px] font-display font-bold text-[#f7d87c] cursor-pointer"
                      >
                        Lotação Máxima (8 Jogadores)
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-display text-[#dfc9ad]">
                        Código da Sala:
                      </label>
                      <input
                        type="text"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value)}
                        className="w-24 px-2 py-0.5 rounded border border-[#9e7b1c]/70 bg-[#140a06] text-[11px] font-mono-num text-[#f7d87c]"
                      />
                    </div>
                  </div>

                  {/* Seat Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {/* Seat #1: Host Player */}
                    <div className="p-1.5 rounded border border-[#f7d87c] bg-[#6b1d2f]/70 flex items-center justify-between text-[11px]">
                      <div className="truncate">
                        <span className="font-display font-bold text-[#faf5e8] block truncate">
                          1. {hostPlayerName}
                        </span>
                        <span className="text-[9px] text-[#f7d87c]">Anfitrião (Você)</span>
                      </div>
                    </div>

                    {additionalSeats.map((seat, idx) => (
                      <div
                        key={seat.id}
                        className="p-1.5 rounded border border-[#9e7b1c]/55 bg-[#1b0e08] flex items-center justify-between gap-1 text-[11px]"
                      >
                        <div className="truncate">
                          <span className="font-display font-bold text-[#f4ebd9] block truncate">
                            {idx + 2}. {seat.name}
                          </span>
                          <span className="text-[9px] text-[#d9a738]">
                            {seat.isBot ? 'Bardo da Taverna' : 'Convidado na Mesa'}
                          </span>
                        </div>
                        {additionalSeats.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSeat(seat.id)}
                            className="p-0.5 rounded text-[#dfc9ad]/70 hover:text-[#e8833a] cursor-pointer"
                            title="Remover assento"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Human Guest Seat Input */}
                  {additionalSeats.length < MAX_QUIZ_PLAYERS - 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={customGuestName}
                        onChange={(e) => setCustomGuestName(e.target.value)}
                        placeholder="Nome de outro jogador na mesa..."
                        className="px-2.5 py-1 rounded border border-[#9e7b1c]/60 bg-[#140a06] text-xs text-[#f4ebd9] flex-1 min-w-[180px]"
                      />
                      <button
                        type="button"
                        data-testid="add-guest-player-btn"
                        onClick={handleAddHumanGuestSeat}
                        className="px-2.5 py-1 rounded border border-[#d9a738] bg-[#362013] hover:bg-[#4e342e] text-[11px] font-display font-bold text-[#f7d87c] cursor-pointer flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Adicionar Jogador ({1 + additionalSeats.length}/8)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-[#dfc9ad]">
                Cartas já descobertas no seu Grimório:{' '}
                <strong className="text-[#f7d87c]">
                  {unlockedArtistIds.length} / {QUIZ_ARTISTS_DB.length}
                </strong>
              </div>
              <button
                type="button"
                data-testid="start-quiz-match-btn"
                onClick={() => handleStartMatch()}
                className="px-4 py-2 rounded-lg border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs sm:text-sm font-display font-extrabold text-[#faf5e8] shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 text-[#f7d87c]" />
                <span>
                  Iniciar Partida ({setupMode === 'solo' ? '1 Jogador' : `${1 + additionalSeats.length} Jogadores`})
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ACTIVE ROUND SCREEN */}
        {match && match.phase === 'active_round' && activeSeat && (
          <div data-testid="quiz-active-round" className="space-y-2.5">
            {/* Turn-Based 1..8 Players Strip (Shows independent Hints & Attempts per seat) */}
            <div
              data-testid="quiz-players-turn-bar"
              className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
            >
              {match.players.map((seat, idx) => {
                const isCurrentTurn = idx === match.currentTurnIndex;
                return (
                  <div
                    key={seat.playerId}
                    data-testid={`quiz-seat-card-${idx}`}
                    className={`p-2 rounded-lg border transition-colors ${
                      isCurrentTurn
                        ? 'border-2 border-[#f7d87c] bg-[#6b1d2f]/80 shadow-md'
                        : seat.status === 'solved'
                        ? 'border-[#2e6b3e] bg-[#182c1d]/80'
                        : seat.status === 'exhausted'
                        ? 'border-[#7b241c]/60 bg-[#23110e]/70 opacity-75'
                        : 'border-[#9e7b1c]/45 bg-[#24130b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-display text-[11px] font-bold text-[#faf5e8] truncate">
                        {idx + 1}. {seat.playerName}
                      </span>
                      {isCurrentTurn && (
                        <span className="px-1.5 py-0.2 rounded bg-[#f7d87c] text-[#24130b] font-display text-[9px] font-extrabold">
                          VEZ ATUAL
                        </span>
                      )}
                      {!isCurrentTurn && seat.status === 'solved' && (
                        <span className="text-[9px] font-display font-bold text-[#7dcea0]">
                          Acertou ({seat.scoreEarned}p)
                        </span>
                      )}
                      {!isCurrentTurn && seat.status === 'exhausted' && (
                        <span className="text-[9px] font-display font-bold text-[#e59866]">
                          Esgotou
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#dfc9ad]">
                      <span data-testid={`seat-hints-${idx}`}>
                        Dicas: <strong className="text-[#f7d87c]">{seat.hintsRevealed}/{MAX_HINTS_PER_PLAYER}</strong>
                      </span>
                      <span data-testid={`seat-attempts-${idx}`}>
                        Tentativas: <strong className="text-[#f7d87c]">{seat.attemptsUsed}/{seat.maxAttempts}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {feedbackBanner && (
              <div
                data-testid="quiz-feedback-banner"
                className={`px-3 py-1.5 rounded border text-xs flex items-center gap-2 ${
                  feedbackBanner.type === 'success'
                    ? 'border-[#7dcea0] bg-[#182c1d] text-[#d4efdf]'
                    : feedbackBanner.type === 'warning'
                    ? 'border-[#e8833a] bg-[#361c0d] text-[#fae5d3]'
                    : 'border-[#d9a738]/60 bg-[#28150c] text-[#f4ebd9]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f7d87c] shrink-0" />
                <span>{feedbackBanner.text}</span>
              </div>
            )}

            {/* Main Two-Column Table Area: Left = Active Player's Independent Clues, Right = Action / Guess Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
              {/* Left 7 cols: Independent Clues Scroll for the current turn player */}
              <div
                data-testid="active-player-clues"
                className="lg:col-span-7 rounded-lg border-2 border-[#8c6722] bg-[#f3e5c8] text-[#24130b] p-3 space-y-2 shadow-inner"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#8c6722]/40 pb-1.5">
                  <div>
                    <span className="font-display text-xs font-extrabold text-[#4a121f] flex items-center gap-1">
                      <ScrollText className="w-3.5 h-3.5 text-[#6b1d2f]" />
                      <span>
                        Pergaminho de Dicas de {activeSeat.playerName}
                      </span>
                    </span>
                    <span className="text-[10px] text-[#5c3b23] block">
                      Mesmo Artista Misterioso da Mesa · Dicas reveladas apenas para {activeSeat.playerName} ({activeSeat.hintsRevealed}/{MAX_HINTS_PER_PLAYER})
                    </span>
                  </div>

                  {!activeSeat.isBot && (
                    <button
                      type="button"
                      data-testid="reveal-hint-btn"
                      disabled={activeSeat.hintsRevealed >= MAX_HINTS_PER_PLAYER}
                      onClick={handleRevealHint}
                      className={`px-2.5 py-1 rounded border text-[10px] font-display font-bold flex items-center gap-1 ${
                        activeSeat.hintsRevealed >= MAX_HINTS_PER_PLAYER
                          ? 'border-[#8c6722]/40 bg-[#d9c7a6] text-[#6d4c41] cursor-not-allowed'
                          : 'border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] cursor-pointer shadow'
                      }`}
                    >
                      <HelpCircle className="w-3 h-3 text-[#f7d87c]" />
                      <span>
                        {activeSeat.hintsRevealed >= MAX_HINTS_PER_PLAYER
                          ? 'Todas as 5 Dicas Abertas'
                          : `Revelar Pista #${activeSeat.hintsRevealed + 1} (+1 Dica Individual)`}
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {targetArtist.hints.map((hintText, hIdx) => {
                    const isUnlockedForCurrentPlayer = hIdx < activeSeat.hintsRevealed;
                    return (
                      <div
                        key={hIdx}
                        data-testid={`clue-row-${hIdx + 1}`}
                        className={`p-2 rounded border text-xs ${
                          isUnlockedForCurrentPlayer
                            ? 'border-[#8c6722]/60 bg-[#fbf4e6] text-[#24130b]'
                            : 'border-dashed border-[#8c6722]/40 bg-[#e4d2b2]/70 text-[#6d4c41] italic'
                        }`}
                      >
                        <span className="font-display font-bold text-[#6b1d2f] mr-1.5">
                          Pista #{hIdx + 1}:
                        </span>
                        {isUnlockedForCurrentPlayer ? (
                          <span>{hintText}</span>
                        ) : (
                          <span>
                            [Selo de Cera Fechado para {activeSeat.playerName}]
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 5 cols: Turn Controls (Human Guess Input + Quick Artist Codex Picks OR Bot Turn Control) */}
              <div className="lg:col-span-5 rounded-lg border border-[#d9a738]/60 bg-[#24130b] p-3 flex flex-col justify-between space-y-2.5">
                {activeSeat.isBot ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#9e7b1c]/40 pb-1.5">
                      <span className="font-display text-xs font-bold text-[#f7d87c] flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-[#d9a738]" />
                        <span>Vez de {activeSeat.playerName}</span>
                      </span>
                      <span className="text-[10px] text-[#dfc9ad]">
                        Tentativa {activeSeat.attemptsUsed + 1}/{DEFAULT_MAX_ATTEMPTS}
                      </span>
                    </div>
                    <p className="text-xs text-[#eadbc8] leading-relaxed">
                      {activeSeat.playerName} está analisando suas próprias pistas na mesa sem revelar nada do seu pergaminho.
                    </p>
                    <button
                      type="button"
                      data-testid="execute-bot-turn-btn"
                      onClick={handleExecuteBotStep}
                      className="w-full py-2 px-3 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-extrabold text-[#faf5e8] cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 text-[#f7d87c]" />
                      <span>Executar Turno de {activeSeat.playerName}</span>
                    </button>

                    <label className="flex items-center gap-2 text-[11px] text-[#dfc9ad] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={autoBotPlay}
                        onChange={(e) => setAutoBotPlay(e.target.checked)}
                        className="accent-[#d9a738]"
                      />
                      <span>Avançar turnos dos Bardos da Taverna automaticamente</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-[#9e7b1c]/40 pb-1">
                      <span className="font-display text-xs font-bold text-[#f7d87c]">
                        Seu Palpite ({activeSeat.playerName})
                      </span>
                      <span className="text-[10px] font-mono-num text-[#d9a738]">
                        Restam {activeSeat.maxAttempts - activeSeat.attemptsUsed} tentativa(s)
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        data-testid="quiz-guess-input"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmitGuess();
                          }
                        }}
                        placeholder="Digite o Artista ou Banda..."
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#9e7b1c] bg-[#140a06] text-xs text-[#faf5e8] focus:outline-none focus:border-[#f7d87c]"
                      />
                      <button
                        type="button"
                        data-testid="submit-guess-btn"
                        onClick={() => handleSubmitGuess()}
                        className="px-3 py-1.5 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-bold text-[#faf5e8] cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3 h-3 text-[#f7d87c]" />
                        <span>Arriscar</span>
                      </button>
                    </div>

                    {/* Quick Codex Suggestions so players can pick with 1 click on Desktop or Mobile */}
                    <div>
                      <span className="block font-display text-[10px] text-[#dfc9ad]/85 mb-1">
                        Escolha Rápida — Artistas & Bandas Reais ({QUIZ_ARTISTS_DB.length}):
                      </span>
                      <div className="grid grid-cols-2 gap-1 max-h-[145px] overflow-y-auto pr-0.5">
                        {QUIZ_ARTISTS_DB.map((artist) => (
                          <button
                            key={artist.id}
                            type="button"
                            data-testid={`quick-guess-${artist.id}`}
                            onClick={() => handleSubmitGuess(artist.name)}
                            className="px-2 py-1 rounded border border-[#9e7b1c]/45 bg-[#180d07] hover:border-[#f7d87c] hover:bg-[#362013] text-left transition-colors cursor-pointer"
                          >
                            <span className="font-display text-[10px] font-bold text-[#f7d87c] block truncate">
                              {artist.name}
                            </span>
                            <span className="text-[9px] text-[#dfc9ad]/80 block truncate">
                              {artist.band}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Player's Personal Guess History */}
                <div className="pt-2 border-t border-[#9e7b1c]/35">
                  <span className="block font-display text-[10px] uppercase tracking-wider text-[#d9a738] mb-1">
                    Histórico Individual de {activeSeat.playerName}:
                  </span>
                  {activeSeat.guessHistory.length === 0 ? (
                    <p className="text-[11px] italic text-[#dfc9ad]/70">
                      Nenhum palpite registrado por {activeSeat.playerName} nesta rodada.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {activeSeat.guessHistory.map((g, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-[10px] font-display flex items-center gap-1 border ${
                            g.isCorrect
                              ? 'border-[#7dcea0] bg-[#182c1d] text-[#d4efdf]'
                              : 'border-[#7b241c] bg-[#2b120e] text-[#f5b7b1]'
                          }`}
                        >
                          {g.isCorrect ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#7dcea0]" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5 text-[#e59866]" />
                          )}
                          <span>{g.guessText}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ROUND FINISHED / ARTIST REVEAL & COLLECTIBLE UNLOCK SCREEN */}
        {match && match.phase === 'round_finished' && (
          <div data-testid="quiz-round-finished" className="space-y-3">
            <div className="rounded-lg border-2 border-[#f7d87c] bg-[#28150c] p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#9e7b1c]/45 pb-2">
                <div>
                  <span className="font-display text-[10px] uppercase tracking-widest text-[#f7d87c] block">
                    Revelação do Artista Secreto da Rodada #{match.roundNumber}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-[#faf5e8]">
                    {targetArtist.name} — {targetArtist.band}
                  </h3>
                  <span className="text-xs text-[#d9a738]">
                    {targetArtist.era} · {targetArtist.country} · Obra: {targetArtist.iconicWork}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2.5 py-1 rounded border border-[#f7d87c] font-display text-xs font-extrabold text-[#faf5e8] flex items-center gap-1"
                    style={{ backgroundColor: targetArtist.rarityColor }}
                  >
                    <Award className="w-3.5 h-3.5 text-[#f7d87c]" />
                    <span>
                      Carta {targetArtist.rarity} ({targetArtist.rarityLabel})
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                {/* Dual Identity Preview: Archival Photo + 16-Bit Pixel Art Sprite */}
                <div className="lg:col-span-6">
                  <CollectibleArtistPreview artistId={targetArtist.id} compact />
                  <p className="mt-2 text-xs text-[#eadbc8] leading-relaxed">
                    {targetArtist.biography}
                  </p>
                </div>

                {/* Round Standings for all 1..8 Players */}
                <div className="lg:col-span-6 rounded border border-[#9e7b1c]/50 bg-[#180d07] p-2.5 space-y-1.5">
                  <span className="font-display text-xs font-bold text-[#f7d87c] block">
                    Resultado da Mesa ({match.players.length} Jogadores · Dicas e Tentativas Individuais)
                  </span>
                  <div className="space-y-1 max-h-[170px] overflow-y-auto pr-1">
                    {match.players.map((p, idx) => (
                      <div
                        key={p.playerId}
                        className="px-2 py-1 rounded border border-[#9e7b1c]/35 bg-[#24130b] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono-num text-[#d9a738] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-display font-bold text-[#faf5e8] truncate">
                            {p.playerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          <span className="text-[#dfc9ad]">
                            {p.hintsRevealed} dicas · {p.attemptsUsed} tent.
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-display font-bold ${
                              p.status === 'solved'
                                ? 'bg-[#1e4620] text-[#a9dfbf]'
                                : 'bg-[#3b1a14] text-[#f5b7b1]'
                            }`}
                          >
                            {p.status === 'solved' ? `+${p.scoreEarned} pts` : 'Não descobriu'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#f7d87c]">
                <BookOpen className="w-4 h-4" />
                <span>
                  A carta de <strong>{targetArtist.name}</strong> está registrada no Grimório de Colecionáveis do balcão!
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="next-round-btn"
                  onClick={handleNextRound}
                  className="px-3.5 py-1.5 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-extrabold text-[#faf5e8] cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-[#f7d87c]" />
                  <span>Próxima Rodada (Novo Artista)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
