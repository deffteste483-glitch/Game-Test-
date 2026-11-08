import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Flame,
  CloudRain,
  BookOpen,
  Music,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AudioMixerState, clampVolume } from '../utils/authLogic';

interface SoundMixerPanelProps {
  mixer: AudioMixerState;
  onChangeMixer: (updated: AudioMixerState) => void;
  isBookOpen: boolean;
  onToggleBook: () => void;
  showBookToggle?: boolean;
}

export const SoundMixerPanel: React.FC<SoundMixerPanelProps> = ({
  mixer,
  onChangeMixer,
  isBookOpen,
  onToggleBook,
  showBookToggle = true,
}) => {
  const [openPopover, setOpenPopover] = useState(false);

  const toggleMasterMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onChangeMixer({
      ...mixer,
      masterMuted: !mixer.masterMuted,
    });
  };

  const updateChannel = (
    channel:
      | 'masterVolume'
      | 'music'
      | 'sfx'
      | 'ambience'
      | 'fireplace'
      | 'rain'
      | 'pages',
    rawVal: number
  ) => {
    const clamped = clampVolume(rawVal);
    const next: AudioMixerState = {
      ...mixer,
      masterMuted: false,
      [channel]: clamped,
    };
    if (channel === 'sfx') {
      next.pages = clamped;
    }
    onChangeMixer(next);
  };

  const toggleSingleChannelMute = (
    channel:
      | 'masterVolume'
      | 'music'
      | 'sfx'
      | 'ambience'
      | 'fireplace'
      | 'rain'
      | 'pages',
    defaultVal: number
  ) => {
    const current = mixer[channel] ?? defaultVal;
    updateChannel(channel, current > 0 ? 0 : defaultVal);
  };

  const masterVol = mixer.masterVolume ?? 85;
  const sfxVol = mixer.sfx ?? 80;
  const ambVol = mixer.ambience ?? 75;

  return (
    <div className="relative pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
      {/* Toggle Book Open/Close Cover Button (Shown on Guestbook screens) */}
      {showBookToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleBook();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded border border-[#9e7b1c]/80 bg-[#24130b]/95 text-[#f4ebd9] hover:bg-[#362013] hover:border-[#d9a738] transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.75)] cursor-pointer whitespace-nowrap text-xs font-display tracking-wide"
          aria-label={
            isBookOpen
              ? 'Fechar Capa do Livro de Visitantes'
              : 'Abrir Livro de Visitantes'
          }
        >
          <BookOpen className="w-3.5 h-3.5 text-[#d9a738] shrink-0" />
          <span className="hidden sm:inline">
            {isBookOpen ? 'Fechar Livro' : 'Abrir Livro'}
          </span>
          <span className="sm:hidden">{isBookOpen ? 'Capa' : 'Livro'}</span>
        </button>
      )}

      {/* Open Independent Audio Mixer Popover Button */}
      <button
        type="button"
        data-testid="btn-audio-mixer"
        onClick={(e) => {
          e.currentTarget.blur();
          setOpenPopover((prev) => !prev);
        }}
        aria-expanded={openPopover}
        aria-label="Controles de Ambiente Sonoro da Taverna"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded border border-[#9e7b1c]/80 bg-[#24130b]/95 text-[#f4ebd9] hover:bg-[#362013] hover:border-[#d9a738] transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.75)] cursor-pointer whitespace-nowrap text-xs font-display tracking-wide"
      >
        <Sliders className="w-3.5 h-3.5 text-[#d9a738] shrink-0" />
        <span className="hidden sm:inline">Ambiente Sonoro</span>
      </button>

      {/* Quick Master Mute Button [M] */}
      <button
        type="button"
        data-testid="btn-master-mute"
        onClick={toggleMasterMute}
        aria-label={
          mixer.masterMuted ? 'Ativar som da taverna' : 'Silenciar todos os sons'
        }
        title="Silenciar / Ativar Som (Tecla M)"
        className={`flex items-center justify-center w-8 h-8 rounded border transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.75)] cursor-pointer ${
          mixer.masterMuted
            ? 'border-[#8c2b40] bg-[#4a121f]/95 text-[#f4ebd9]'
            : 'border-[#9e7b1c]/80 bg-[#24130b]/95 text-[#d9a738] hover:bg-[#362013]'
        }`}
      >
        {mixer.masterMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* Independent Multi-Channel Audio Mixer Panel */}
      {openPopover && (
        <div
          role="dialog"
          aria-label="Mixer de Volume da Taverna"
          className="absolute right-0 top-11 z-50 w-72 sm:w-80 rounded-md border-2 border-[#9e7b1c] bg-[#1f120b] p-3.5 text-[#f4ebd9] shadow-[0_16px_40px_rgba(0,0,0,0.94)]"
        >
          <div className="flex items-center justify-between border-b border-[#9e7b1c]/40 pb-2 mb-2.5">
            <div>
              <h3 className="font-display text-xs font-bold tracking-wider text-[#d9a738]">
                Acústica & Atmosfera Sonora
              </h3>
              <p className="text-[10px] text-[#dfc9ad]/80">
                Volume geral, música, efeitos e ambiente
              </p>
            </div>
            <button
              type="button"
              onClick={toggleMasterMute}
              className={`px-2 py-1 rounded text-[10px] font-display tracking-wide border cursor-pointer transition-colors whitespace-nowrap ${
                mixer.masterMuted
                  ? 'border-[#d9a738] bg-[#6b1d2f] text-[#faf5e8]'
                  : 'border-[#9e7b1c]/60 bg-[#362013] text-[#f4ebd9] hover:border-[#d9a738]'
              }`}
            >
              {mixer.masterMuted ? 'Som Silenciado' : 'Silenciar Tudo'}
            </button>
          </div>

          <div className="space-y-2.5">
            {/* 1. Volume Geral */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleSingleChannelMute('masterVolume', 85)}
                  className="flex items-center gap-1.5 text-[#f4ebd9] hover:text-[#d9a738] cursor-pointer font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#f7d87c]" />
                  <span>Volume Geral</span>
                </button>
                <span className="font-mono-num text-[11px] text-[#f7d87c]">
                  {mixer.masterMuted ? 0 : masterVol}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                aria-label="Volume Geral"
                value={mixer.masterMuted ? 0 : masterVol}
                onChange={(e) =>
                  updateChannel('masterVolume', Number(e.target.value))
                }
                className="w-full accent-[#d9a738] h-1.5 bg-[#362013] rounded cursor-pointer"
              />
            </div>

            {/* 2. Música Medieval Instrumental */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleSingleChannelMute('music', 65)}
                  className="flex items-center gap-1.5 text-[#f4ebd9] hover:text-[#d9a738] cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-[#d9a738]" />
                  <span>Música (Alaúde Medieval)</span>
                </button>
                <span className="font-mono-num text-[11px] text-[#d9a738]">
                  {mixer.masterMuted ? 0 : mixer.music}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                aria-label="Volume da Música Instrumental Medieval"
                value={mixer.masterMuted ? 0 : mixer.music}
                onChange={(e) => updateChannel('music', Number(e.target.value))}
                className="w-full accent-[#d9a738] h-1.5 bg-[#362013] rounded cursor-pointer"
              />
            </div>

            {/* 3. Efeitos Sonoros (Passos, Páginas, Canecas, Objetos) */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleSingleChannelMute('sfx', 80)}
                  className="flex items-center gap-1.5 text-[#f4ebd9] hover:text-[#d9a738] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#dfc9ad]" />
                  <span>Efeitos Sonoros (Passos & Objetos)</span>
                </button>
                <span className="font-mono-num text-[11px] text-[#d9a738]">
                  {mixer.masterMuted ? 0 : sfxVol}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                aria-label="Volume de Efeitos Sonoros"
                value={mixer.masterMuted ? 0 : sfxVol}
                onChange={(e) => updateChannel('sfx', Number(e.target.value))}
                className="w-full accent-[#d9a738] h-1.5 bg-[#362013] rounded cursor-pointer"
              />
            </div>

            {/* 4. Ambiente Geral (Salão, Lareira & Chuva) */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => toggleSingleChannelMute('ambience', 75)}
                  className="flex items-center gap-1.5 text-[#f4ebd9] hover:text-[#d9a738] cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-[#e8833a]" />
                  <span>Ambiente da Taverna</span>
                </button>
                <span className="font-mono-num text-[11px] text-[#d9a738]">
                  {mixer.masterMuted ? 0 : ambVol}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                aria-label="Volume do Ambiente da Taverna"
                value={mixer.masterMuted ? 0 : ambVol}
                onChange={(e) => updateChannel('ambience', Number(e.target.value))}
                className="w-full accent-[#d9a738] h-1.5 bg-[#362013] rounded cursor-pointer"
              />
            </div>

            {/* Sub-canais de Ambiente: Lareira & Chuva */}
            <div className="pt-1.5 border-t border-[#9e7b1c]/30 grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-[#dfc9ad]">
                    <Flame className="w-3 h-3 text-[#e8833a]" />
                    Lareira
                  </span>
                  <span className="font-mono-num text-[10px] text-[#d9a738]">
                    {mixer.masterMuted ? 0 : mixer.fireplace}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  aria-label="Volume do Crepitar da Lareira"
                  value={mixer.masterMuted ? 0 : mixer.fireplace}
                  onChange={(e) =>
                    updateChannel('fireplace', Number(e.target.value))
                  }
                  className="w-full accent-[#d9a738] h-1 bg-[#362013] rounded cursor-pointer"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-[#dfc9ad]">
                    <CloudRain className="w-3 h-3 text-[#8ab4d6]" />
                    Chuva
                  </span>
                  <span className="font-mono-num text-[10px] text-[#d9a738]">
                    {mixer.masterMuted ? 0 : mixer.rain}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  aria-label="Volume da Chuva nas Janelas"
                  value={mixer.masterMuted ? 0 : mixer.rain}
                  onChange={(e) => updateChannel('rain', Number(e.target.value))}
                  className="w-full accent-[#d9a738] h-1 bg-[#362013] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
