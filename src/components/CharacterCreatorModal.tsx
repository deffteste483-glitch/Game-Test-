import React, { useState } from 'react';
import {
  Sparkles,
  Shuffle,
  Check,
  Compass,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-react';
import {
  ACCESSORY_OPTIONS,
  ANIMATION_META,
  AdventurerAnimation,
  AdventurerAppearance,
  CLOAK_OPTIONS,
  EXPRESSION_OPTIONS,
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HAT_OPTIONS,
  OUTFIT_OPTIONS,
  SKIN_TONE_OPTIONS,
  generateRandomAdventurer,
} from '../utils/characterLogic';
import { PixelAdventurerCanvas } from './PixelAdventurerCanvas';

import parchmentTextureUrl from '../assets/images/parchment_page_texture_1794078191137.jpg';
import leatherCoverUrl from '../assets/images/aged_leather_cover_1794078190518.jpg';

interface CharacterCreatorModalProps {
  appearance: AdventurerAppearance;
  onChangeAppearance: (updated: AdventurerAppearance) => void;
  onConfirmAndEnterHall: () => void;
  onBackToConfirmation: () => void;
  onPlaySoundEffect: (type: 'flip' | 'quill' | 'fanfare') => void;
}

type CreatorCategory = 'skin_eyes' | 'hair' | 'outfit_cloak' | 'hat_accessories';

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  appearance,
  onChangeAppearance,
  onConfirmAndEnterHall,
  onBackToConfirmation,
  onPlaySoundEffect,
}) => {
  const [activeCategory, setActiveCategory] = useState<CreatorCategory>('skin_eyes');
  const [previewAnim, setPreviewAnim] = useState<AdventurerAnimation>('idle');
  const [facing, setFacing] = useState<'left' | 'right'>('right');

  const updateField = <K extends keyof AdventurerAppearance>(
    key: K,
    value: AdventurerAppearance[K]
  ) => {
    onPlaySoundEffect('quill');
    onChangeAppearance({
      ...appearance,
      [key]: value,
    });
  };

  const handleRandomize = () => {
    onPlaySoundEffect('flip');
    const randomized = generateRandomAdventurer(appearance.adventurerName);
    onChangeAppearance(randomized);
    setPreviewAnim('celebrate');
    window.setTimeout(() => setPreviewAnim('idle'), 2000);
  };

  return (
    <div
      data-testid="character-creator-view"
      className="relative mx-auto w-full max-w-[1060px] transition-all duration-200"
    >
      <div
        className="relative rounded-xl p-2.5 sm:p-4 border-4 border-[#2b160c] shadow-[0_24px_60px_rgba(0,0,0,0.94),0_0_35px_rgba(217,167,56,0.18)]"
        style={{
          backgroundColor: '#2c170e',
          backgroundImage: `linear-gradient(180deg, rgba(44,23,14,0.85), rgba(28,14,8,0.92)), url(${leatherCoverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative rounded-lg border-2 border-[#8c6722]/75 bg-[#dfd0b8] p-1 sm:p-1.5 shadow-inner">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded overflow-hidden">
            {/* ================================================================= */}
            {/* LEFT COLUMN (5 cols): REAL-TIME PIXEL ART PREVIEW & ANIMATIONS    */}
            {/* ================================================================= */}
            <section
              aria-label="Visualização em Tempo Real do Personagem"
              className="lg:col-span-5 p-4 sm:p-5 bg-[#1b0f09] text-[#f4ebd9] border-b-2 lg:border-b-0 lg:border-r-2 border-[#8c6722]/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#9e7b1c]/40 pb-2.5 mb-3">
                  <div>
                    <h1 className="font-display text-sm sm:text-base font-extrabold tracking-wider text-[#f7d87c]">
                      Forja de Aventureiro 16-Bit
                    </h1>
                    <p className="text-xs text-[#dfc9ad]/85">
                      Visualização ao vivo em pixel art autêntica
                    </p>
                  </div>

                  {/* Auto-save indicator */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#d9a738]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvo</span>
                  </span>
                </div>

                {/* Tavern Wooden Stage Pedestal for Character Preview */}
                <div
                  className="relative rounded-lg border-2 border-[#9e7b1c]/70 bg-[#26140b] p-4 flex flex-col items-center justify-center min-h-[230px] overflow-hidden shadow-inner"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 42%, rgba(217,167,56,0.25) 0%, rgba(58,30,16,0.75) 55%, rgba(22,12,7,0.98) 100%)',
                  }}
                >
                  {/* Top Pedestal Controls: Flip Direction & Randomize */}
                  <div className="w-full flex items-center justify-between gap-2 mb-1 z-10">
                    <button
                      type="button"
                      onClick={() =>
                        setFacing((prev) => (prev === 'right' ? 'left' : 'right'))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#9e7b1c]/60 bg-[#1a0d07]/90 hover:border-[#f7d87c] text-[11px] font-display text-[#f4ebd9] cursor-pointer whitespace-nowrap"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-[#d9a738]" />
                      <span>Virar ({facing === 'right' ? 'Dir' : 'Esq'})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#d9a738] bg-[#6b1d2f] hover:bg-[#82243a] text-[11px] font-display font-bold text-[#faf5e8] cursor-pointer whitespace-nowrap"
                    >
                      <Shuffle className="w-3 h-3 text-[#f7d87c]" />
                      <span>Aparência Aleatória</span>
                    </button>
                  </div>

                  {/* Real-time 16-bit Pixel Art Adventurer Sprite */}
                  <div className="my-1 flex flex-col items-center">
                    <PixelAdventurerCanvas
                      appearance={appearance}
                      animation={previewAnim}
                      facing={facing}
                      scale="xl"
                    />
                  </div>

                  {/* Character Nameplate on Pedestal */}
                  <div className="mt-1 px-3 py-1 rounded border border-[#c59b27]/75 bg-[#160c07]/95 text-center shadow">
                    <div className="font-display text-xs sm:text-sm font-bold tracking-wider text-[#f7d87c]">
                      {appearance.adventurerName || 'Viajante sem Nome'}
                    </div>
                  </div>
                </div>

                {/* 8 Animation Preview Selector Buttons */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-[11px] font-bold tracking-wider text-[#d9a738]">
                      Testar Animações do Personagem (8 Modos)
                    </span>
                  </div>
                  <div
                    role="group"
                    aria-label="Animações do Aventureiro"
                    className="flex flex-wrap gap-1.5"
                  >
                    {ANIMATION_META.map((anim) => (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => {
                          onPlaySoundEffect('quill');
                          setPreviewAnim(anim.id);
                        }}
                        className={`px-2.5 py-1.5 rounded border text-[11px] font-display font-semibold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                          previewAnim === anim.id
                            ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                            : 'border-[#9e7b1c]/45 bg-[#2a160d] text-[#eadbc8] hover:border-[#d9a738]'
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#9e7b1c]/35 text-[11px] text-[#dfc9ad]/80 flex items-center justify-between">
                <span>Pixel Art 16-Bit Nativa (48×56)</span>
                <span className="font-mono-num">Sincronização Ativa</span>
              </div>
            </section>

            {/* ================================================================= */}
            {/* RIGHT COLUMN (7 cols): PARCHMENT CUSTOMIZATION CONTROLS           */}
            {/* ================================================================= */}
            <section
              aria-label="Opções de Personalização do Aventureiro"
              className="lg:col-span-7 p-4 sm:p-6 text-[#26160c] flex flex-col justify-between"
              style={{
                backgroundColor: '#f3e6cf',
                backgroundImage: `linear-gradient(135deg, rgba(248,240,224,0.88) 0%, rgba(226,205,172,0.92) 100%), url(${parchmentTextureUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'right center',
              }}
            >
              <div className="rounded border border-[#8c6722]/60 p-3.5 sm:p-4 bg-[#f8efe0]/60 flex flex-col justify-between h-full">
                <div>
                  {/* Adventurer Name Input */}
                  <div className="mb-3 pb-3 border-b border-[#8c6722]/45">
                    <label
                      htmlFor="adventurer-name-input"
                      className="block font-display text-xs font-bold tracking-wide text-[#4a121f] mb-1"
                    >
                      Nome e Título do Seu Aventureiro na Taverna
                    </label>
                    <input
                      id="adventurer-name-input"
                      type="text"
                      maxLength={28}
                      value={appearance.adventurerName}
                      onChange={(e) => updateField('adventurerName', e.target.value)}
                      placeholder="Ex.: Aldous, o Bardo"
                      className="manuscript-input w-full px-3 py-1.5 rounded border border-[#8c6722]/80 bg-[#ecddc2]/90 text-[#24130b] font-display text-sm font-bold focus:outline-none focus:border-[#6b1d2f]"
                    />
                  </div>

                  {/* 4 Category Tabs */}
                  <div
                    role="tablist"
                    aria-label="Categorias de Personalização"
                    className="flex flex-wrap items-center gap-1.5 border-b border-[#8c6722]/45 pb-2.5 mb-3"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === 'skin_eyes'}
                      onClick={() => {
                        onPlaySoundEffect('flip');
                        setActiveCategory('skin_eyes');
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-display font-bold tracking-wide cursor-pointer whitespace-nowrap ${
                        activeCategory === 'skin_eyes'
                          ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                          : 'bg-[#e6d3b3]/80 text-[#3e2723] hover:bg-[#dcc39b]'
                      }`}
                    >
                      1. Pele, Olhos & Expressão
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === 'hair'}
                      onClick={() => {
                        onPlaySoundEffect('flip');
                        setActiveCategory('hair');
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-display font-bold tracking-wide cursor-pointer whitespace-nowrap ${
                        activeCategory === 'hair'
                          ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                          : 'bg-[#e6d3b3]/80 text-[#3e2723] hover:bg-[#dcc39b]'
                      }`}
                    >
                      2. Cabelos & Cores
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === 'outfit_cloak'}
                      onClick={() => {
                        onPlaySoundEffect('flip');
                        setActiveCategory('outfit_cloak');
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-display font-bold tracking-wide cursor-pointer whitespace-nowrap ${
                        activeCategory === 'outfit_cloak'
                          ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                          : 'bg-[#e6d3b3]/80 text-[#3e2723] hover:bg-[#dcc39b]'
                      }`}
                    >
                      3. Roupas & Capas
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === 'hat_accessories'}
                      onClick={() => {
                        onPlaySoundEffect('flip');
                        setActiveCategory('hat_accessories');
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-display font-bold tracking-wide cursor-pointer whitespace-nowrap ${
                        activeCategory === 'hat_accessories'
                          ? 'bg-[#6b1d2f] text-[#faf5e8] shadow-sm'
                          : 'bg-[#e6d3b3]/80 text-[#3e2723] hover:bg-[#dcc39b]'
                      }`}
                    >
                      4. Chapéus & Óculos
                    </button>
                  </div>

                  {/* CATEGORY 1: SKIN TONE, EYES & EXPRESSION */}
                  {activeCategory === 'skin_eyes' && (
                    <div className="space-y-3">
                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Tons de Pele
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {SKIN_TONE_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('skinTone', opt.id)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
                                appearance.skinTone === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-sm border border-[#24130b]/60 shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                                aria-hidden="true"
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Cor dos Olhos
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EYE_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('eyeColor', opt.id)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
                                appearance.eyeColor === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-sm border border-[#24130b]/60 shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                                aria-hidden="true"
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Expressão Facial
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EXPRESSION_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('expression', opt.id)}
                              className={`px-2.5 py-1.5 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.expression === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY 2: HAIR STYLES & HAIR COLORS */}
                  {activeCategory === 'hair' && (
                    <div className="space-y-3">
                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Corte e Penteado
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HAIR_STYLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('hairStyle', opt.id)}
                              className={`px-2.5 py-2 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.hairStyle === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Cor do Cabelo e Barba
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HAIR_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('hairColor', opt.id)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors ${
                                appearance.hairColor === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-sm border border-[#24130b]/60 shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                                aria-hidden="true"
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY 3: MEDIEVAL OUTFITS & CLOAKS */}
                  {activeCategory === 'outfit_cloak' && (
                    <div className="space-y-3">
                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Roupas e Trajes Medievais
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {OUTFIT_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('outfit', opt.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.outfit === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              <span
                                className="w-4 h-4 rounded-sm border border-[#24130b]/60 shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                                aria-hidden="true"
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Capas, Mantos e Casacos
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {CLOAK_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('cloak', opt.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.cloak === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              {opt.swatch && (
                                <span
                                  className="w-4 h-4 rounded-sm border border-[#24130b]/60 shrink-0"
                                  style={{ backgroundColor: opt.swatch }}
                                  aria-hidden="true"
                                />
                              )}
                              <span className="truncate">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY 4: HATS, GLASSES & ACCESSORIES */}
                  {activeCategory === 'hat_accessories' && (
                    <div className="space-y-3">
                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Chapéus, Capuzes e Tiaras
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HAT_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('hat', opt.id)}
                              className={`px-2.5 py-2 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.hat === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block font-display text-xs font-bold text-[#3e2723] mb-1.5">
                          Óculos, Barba e Detalhes Visuais
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {ACCESSORY_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateField('accessory', opt.id)}
                              className={`px-2.5 py-2 rounded border text-xs font-display font-bold cursor-pointer transition-colors ${
                                appearance.accessory === opt.id
                                  ? 'border-[#6b1d2f] bg-[#6b1d2f] text-[#faf5e8]'
                                  : 'border-[#8c6722]/60 bg-[#ecddc2]/85 text-[#24130b] hover:bg-[#e2cca8]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer: Enter Tavern Hall or Return to Book */}
                <div className="mt-4 pt-3 border-t border-[#8c6722]/45 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onBackToConfirmation}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded border border-[#8c6722] bg-[#e6d3b3] hover:bg-[#dcc39b] text-[#3e2723] font-display text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#6b1d2f]" />
                    <span>Voltar à Assinatura</span>
                  </button>

                  <button
                    type="button"
                    data-start="true"
                    onClick={onConfirmAndEnterHall}
                    className="flex-1 min-w-[240px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-xs sm:text-sm font-bold tracking-wide shadow-[0_6px_16px_rgba(74,18,31,0.5)] cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-[#f7d87c] shrink-0" />
                    <span>Confirmar Aventureiro & Ir ao Salão</span>
                    <Compass className="w-4 h-4 text-[#f7d87c] shrink-0" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
