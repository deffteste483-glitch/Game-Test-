import React, { useEffect, useRef, useState } from 'react';
import { QUIZ_ARTISTS_DB } from '../utils/quizCatalogAndLogic';

interface CollectibleArtistPreviewProps {
  compact?: boolean;
  showFullEncyclopedia?: boolean;
  artistId?: string;
}

/**
 * Demonstrates the Musical Tavern's core visual identity rule:
 * Every musician/band has two complementary representations:
 * 1) Real/Archival Biographic Portrait Frame (used in biographies & reveals)
 * 2) 16-Bit Pixel Art Collectible Character (matching the mascot's pixel-art standard)
 */
export const CollectibleArtistPreview: React.FC<CollectibleArtistPreviewProps> = ({
  compact = false,
  showFullEncyclopedia = false,
  artistId,
}) => {
  const [activeView, setActiveView] = useState<'both' | 'pixel' | 'portrait'>('both');
  const [selectedArtistId, setSelectedArtistId] = useState<string>(
    artistId || QUIZ_ARTISTS_DB[0].id
  );
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (artistId) {
      setSelectedArtistId(artistId);
    }
  }, [artistId]);

  const activeArtist =
    QUIZ_ARTISTS_DB.find((a) => a.id === (artistId || selectedArtistId)) ||
    QUIZ_ARTISTS_DB[0];

  useEffect(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animId = 0;
    let timerId = 0;
    let disposed = false;
    const start = performance.now();

    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };

    const drawBard = (now: number) => {
      if (disposed) return;
      const t = (now - start) / 1000;
      const bob = Math.sin(t * 3.5) > 0.2 ? 1 : 0;

      ctx.clearRect(0, 0, 36, 38);

      const hy = 5 + bob;
      const ty = 17 + bob;

      // Hair silhouette (with artist-specific iconic hairstyles like Amy's beehive or Freddie's short hair)
      if (activeArtist.id === 'artist_amy') {
        px(10, hy - 3, 16, 16, '#160c07');
        px(11, hy - 2, 14, 14, activeArtist.hairColor);
      } else if (activeArtist.id === 'artist_julian') {
        px(11, hy + 1, 14, 9, '#160c07');
        px(12, hy + 2, 12, 7, activeArtist.hairColor);
      } else {
        px(10, hy, 16, 13, '#160c07');
        px(11, hy + 1, 14, 11, activeArtist.hairColor);
        px(12, hy + 1, 12, 3, '#4a2b19');
      }

      // Face (adapts skin tone for Nina Simone, B.B. King, Milton Nascimento)
      const isDeepSkin =
        activeArtist.id === 'artist_celeste' ||
        activeArtist.id === 'artist_balthazar' ||
        activeArtist.id === 'artist_milton';
      const faceBase = isDeepSkin ? '#7a4b2a' : '#e3ab82';
      const faceHi = isDeepSkin ? '#945d36' : '#f4c6a4';
      px(13, hy + 4, 10, 8, faceBase);
      px(14, hy + 4, 8, 2, faceHi);

      // David Bowie's Aladdin Sane lightning bolt across face
      if (activeArtist.id === 'artist_bowie') {
        px(19, hy + 4, 2, 3, '#e74c3c');
        px(18, hy + 7, 2, 3, '#2980b9');
        px(17, hy + 10, 2, 2, '#e74c3c');
      }

      // Iconic round tinted spectacles (Rita Lee, Raul Seixas) or eyes
      if (activeArtist.id === 'artist_ritalee' || activeArtist.id === 'artist_mateo') {
        const lensColor = activeArtist.id === 'artist_ritalee' ? '#e74c3c' : '#2c1810';
        px(13, hy + 6, 4, 3, '#d9a738');
        px(14, hy + 7, 2, 1, lensColor);
        px(19, hy + 6, 4, 3, '#d9a738');
        px(20, hy + 7, 2, 1, lensColor);
        px(17, hy + 7, 2, 1, '#d9a738');
      } else {
        px(14, hy + 7, 2, 2, '#160c07');
        px(20, hy + 7, 2, 2, '#160c07');
      }

      // Mustache / expression (Freddie Mercury, Raul Seixas)
      if (activeArtist.id === 'artist_julian' || activeArtist.id === 'artist_mateo') {
        px(14, hy + 10, 8, 2, '#171210');
      } else {
        px(16, hy + 10, 4, 1, '#8c2b40');
      }

      // Stage jacket / outfit with gold details
      px(10, ty, 16, 15, '#160c07');
      px(11, ty + 1, 14, 13, activeArtist.coatColor);
      px(10, ty + 1, 3, 2, '#d9a738');
      px(23, ty + 1, 3, 2, '#d9a738');
      px(16, ty + 1, 4, 9, '#f7eedc');

      // Instrument held diagonally across chest (or double-neck for Jimmy Page)
      const strum = Math.sin(t * 7) > 0 ? 1 : 0;
      px(9, ty + 5, 13, 8, '#160c07');
      px(10, ty + 6, 11, 6, activeArtist.instrumentColor);
      px(12, ty + 7, 7, 4, '#f2c14e');
      px(14, ty + 8, 2, 2, '#24130b');
      // Guitar neck(s)
      px(21, ty + 3, 7, 3, '#52321f');
      px(27, ty + 2, 3, 3, '#d9a738');
      if (activeArtist.id === 'artist_orion') {
        // Double-neck second neck for Jimmy Page
        px(21, ty + 7, 7, 2, '#52321f');
      }

      // Strumming hand
      px(13, ty + 6 + strum, 3, 2, faceHi);

      timerId = window.setTimeout(() => {
        if (!disposed) animId = requestAnimationFrame(drawBard);
      }, 140);
    };

    animId = requestAnimationFrame(drawBard);
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
    };
  }, [activeArtist]);

  return (
    <div className="rounded border border-[#8c6722]/45 bg-[#e6d4b5]/75 p-2.5 text-[#26160c]">
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#8c6722]/30 pb-1.5 mb-2">
        <span className="font-display text-[11px] font-bold tracking-wide text-[#4a121f]">
          Códice de Lendas Reais da Música · Dupla Identidade
        </span>
        <div
          className="flex items-center gap-1 shrink-0"
          role="group"
          aria-label="Alternar visualização de artista"
        >
          <button
            type="button"
            onClick={() => setActiveView('both')}
            className={`px-1.5 py-0.5 text-[10px] font-display rounded transition-colors cursor-pointer whitespace-nowrap ${
              activeView === 'both'
                ? 'bg-[#6b1d2f] text-[#faf5e8]'
                : 'text-[#4e342e] hover:bg-[#8c6722]/20'
            }`}
          >
            Ambos
          </button>
          <button
            type="button"
            onClick={() => setActiveView('portrait')}
            className={`px-1.5 py-0.5 text-[10px] font-display rounded transition-colors cursor-pointer whitespace-nowrap ${
              activeView === 'portrait'
                ? 'bg-[#6b1d2f] text-[#faf5e8]'
                : 'text-[#4e342e] hover:bg-[#8c6722]/20'
            }`}
          >
            Foto Real
          </button>
          <button
            type="button"
            onClick={() => setActiveView('pixel')}
            className={`px-1.5 py-0.5 text-[10px] font-display rounded transition-colors cursor-pointer whitespace-nowrap ${
              activeView === 'pixel'
                ? 'bg-[#6b1d2f] text-[#faf5e8]'
                : 'text-[#4e342e] hover:bg-[#8c6722]/20'
            }`}
          >
            Pixel 16-Bit
          </button>
        </div>
      </div>

      {/* Optional Encyclopedia Selector when viewed inside the Estante Musical */}
      {showFullEncyclopedia && (
        <div className="mb-2 space-y-1.5">
          <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto pr-0.5">
            {QUIZ_ARTISTS_DB.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedArtistId(entry.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-display font-bold cursor-pointer border transition-colors ${
                  selectedArtistId === entry.id
                    ? 'bg-[#6b1d2f] text-[#faf5e8] border-[#d9a738]'
                    : 'bg-[#f7eedc] text-[#3e2723] border-[#8c6722]/40 hover:border-[#6b1d2f]'
                }`}
              >
                {entry.name} ({entry.band})
              </button>
            ))}
          </div>

          <div className="p-2 rounded border border-[#8c6722]/40 bg-[#faf3e6]/90">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-display text-xs font-extrabold text-[#4a121f]">
                {activeArtist.name} — {activeArtist.band}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#4a121f] text-[#f7d87c] font-display text-[9px] font-bold">
                {activeArtist.rarityLabel}
              </span>
            </div>
            <div className="text-[10px] font-display font-semibold text-[#6d4c41] mb-1">
              {activeArtist.era} · {activeArtist.country} · Obra: {activeArtist.iconicWork}
            </div>
            <p className="text-[11px] leading-snug text-[#2c170e]">
              {activeArtist.biography}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
        {/* 1. Archival Photographic Portrait Representation */}
        {(activeView === 'both' || activeView === 'portrait') && (
          <div
            className={`flex items-center gap-2 p-1.5 rounded border border-[#8c6722]/40 bg-[#f7eedc]/80 ${
              activeView === 'portrait' ? 'col-span-2' : ''
            }`}
          >
            <div className="relative w-11 h-11 shrink-0 rounded overflow-hidden border border-[#52321f] bg-[#2a1a11] flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-full h-full" aria-hidden="true">
                <defs>
                  <radialGradient id="sepiaVig" cx="50%" cy="45%" r="60%">
                    <stop offset="0%" stopColor={activeArtist.sepiaTone} />
                    <stop offset="70%" stopColor="#7a5638" />
                    <stop offset="100%" stopColor="#26160c" />
                  </radialGradient>
                </defs>
                <rect width="48" height="48" fill="url(#sepiaVig)" />
                <path d="M12 46 C12 34, 36 34, 36 46 Z" fill="#1f120b" />
                <path
                  d="M14 22 C13 11, 35 11, 34 22 C35 28, 32 33, 24 33 C16 33, 13 28, 14 22 Z"
                  fill="#362013"
                />
                <ellipse cx="24" cy="22" rx="6.5" ry="8" fill="#c9a57c" />
                <circle
                  cx="21.5"
                  cy="21"
                  r="2.2"
                  stroke="#26160c"
                  strokeWidth="1"
                  fill="none"
                />
                <circle
                  cx="26.5"
                  cy="21"
                  r="2.2"
                  stroke="#26160c"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M18 38 L33 27"
                  stroke="#e6c79c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <rect
                  x="2"
                  y="2"
                  width="44"
                  height="44"
                  fill="none"
                  stroke="#d9a738"
                  strokeWidth="0.8"
                  strokeOpacity="0.6"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-display text-[10px] font-bold text-[#3e2723] truncate">
                {activeArtist.name} ({activeArtist.band})
              </div>
              <p className="text-[10.5px] leading-tight text-[#4e342e] truncate">
                {activeArtist.iconicWork}
              </p>
            </div>
          </div>
        )}

        {/* 2. 16-Bit Pixel Art Collectible Character Representation */}
        {(activeView === 'both' || activeView === 'pixel') && (
          <div
            className={`flex items-center gap-2 p-1.5 rounded border border-[#8c6722]/40 bg-[#f7eedc]/80 ${
              activeView === 'pixel' ? 'col-span-2' : ''
            }`}
          >
            <div className="relative w-11 h-11 shrink-0 rounded border border-[#52321f] bg-[#24130b] flex items-center justify-center">
              <canvas
                ref={pixelCanvasRef}
                width={36}
                height={38}
                className="pixel-canvas w-9 h-9"
              />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[10px] font-bold text-[#6b1d2f] truncate">
                Representação Pixel 16-Bit
              </div>
              <p className="text-[11px] leading-tight text-[#4e342e]">
                Sprite 16-bit fiel aos trajes e instrumentos.
              </p>
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <p className="mt-1.5 text-[11px] italic text-[#4e342e] leading-snug">
          Cada artista descoberto na Taverna une sua fotografia histórica ao seu avatar colecionável em pixel art 16-bit.
        </p>
      )}
    </div>
  );
};
