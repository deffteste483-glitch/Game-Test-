import React, { useEffect, useRef } from 'react';

export type MascotMood = 'idle' | 'wave' | 'curious' | 'celebrate';

interface PixelBartenderProps {
  mood: MascotMood;
  speechText: string;
  onWaveTrigger?: () => void;
}

/**
 * Authentic 16-bit Pixel Art Tavern Attendant ("Barnaby, o Guardião dos Acordes")
 * Drawn on a true 48x52 low-res pixel grid and scaled with crisp integer pixels (`image-rendering: pixelated`).
 */
export const PixelBartender: React.FC<PixelBartenderProps> = ({
  mood,
  speechText,
  onWaveTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const moodRef = useRef<MascotMood>(mood);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animId = 0;
    let startTime = performance.now();

    // 16-bit Medieval Tavern Palette
    const P = {
      outline: '#160c07',
      hairDark: '#3b2214',
      hairMid: '#59341f',
      hairLight: '#7a492c',
      skinShadow: '#c78c63',
      skinBase: '#e3ab82',
      skinLight: '#f4c6a4',
      cheek: '#d46a5e',
      eyeWhite: '#faf5e8',
      eyePupil: '#24130b',
      shirtShadow: '#c7b293',
      shirtBase: '#e6d5b8',
      shirtLight: '#f7eedc',
      vestWineDark: '#4a121f',
      vestWine: '#6b1d2f',
      vestWineLight: '#8c2b40',
      apronDark: '#362013',
      apronBase: '#52321f',
      apronLight: '#6e452c',
      goldDark: '#946b18',
      goldBright: '#d9a738',
      goldHighlight: '#f7d87c',
      mugWood: '#613b23',
      mugFoam: '#fcf6e8',
      noteGold: '#f2c14e',
    };

    const px = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };

    let timerId = 0;
    let disposed = false;

    const renderFrame = (now: number) => {
      if (disposed) return;

      const elapsed = (now - startTime) / 1000;
      const currentMood = moodRef.current;

      ctx.clearRect(0, 0, 48, 52);

      // Breathing vertical offset (0 or 1 pixel every ~1.6s)
      const breathe = Math.sin(elapsed * 3.2) > 0.25 ? 1 : 0;
      // Blinking (every ~3.8s for 0.16s)
      const isBlinking = (elapsed % 3.8) > 3.64;
      // Curious lean when typing or flipping pages
      const headTiltX = currentMood === 'curious' ? 1 : 0;
      const headY = 7 + (currentMood === 'celebrate' ? (Math.sin(elapsed * 12) > 0 ? -1 : 0) : breathe);
      const torsoY = 23 + breathe;

      // --- 1. SHADOW & SHOULDERS / CAPE OUTLINE ---
      px(13, torsoY, 22, 22, P.outline);

      // --- 2. MEDIEVAL LINEN SHIRT (Rolled warm ivory sleeves) ---
      px(11, torsoY + 2, 26, 14, P.outline);
      px(12, torsoY + 3, 24, 12, P.shirtShadow);
      px(13, torsoY + 3, 22, 10, P.shirtBase);
      px(15, torsoY + 3, 18, 4, P.shirtLight);

      // --- 3. BURGUNDY WINE TAVERN VEST & COLLAR ---
      px(15, torsoY + 1, 18, 16, P.outline);
      px(16, torsoY + 2, 16, 14, P.vestWineDark);
      px(17, torsoY + 2, 5, 13, P.vestWine);
      px(26, torsoY + 2, 5, 13, P.vestWine);
      px(18, torsoY + 3, 2, 8, P.vestWineLight);
      px(28, torsoY + 3, 2, 8, P.vestWineLight);

      // Shirt V-neck & golden lute-pin brooch at collar
      px(22, torsoY + 2, 4, 6, P.shirtLight);
      px(23, torsoY + 4, 2, 2, P.goldBright);
      px(23, torsoY + 4, 1, 1, P.goldHighlight);

      // --- 4. AGED LEATHER APRON WITH BRASS BUCKLES ---
      px(16, torsoY + 9, 16, 15, P.outline);
      px(17, torsoY + 10, 14, 13, P.apronDark);
      px(18, torsoY + 10, 12, 12, P.apronBase);
      px(19, torsoY + 11, 9, 9, P.apronLight);
      // Apron straps
      px(19, torsoY + 3, 2, 7, P.apronBase);
      px(27, torsoY + 3, 2, 7, P.apronBase);
      // Brass buckles on straps
      px(19, torsoY + 8, 2, 2, P.goldBright);
      px(27, torsoY + 8, 2, 2, P.goldBright);
      // Belt & Pocket detail
      px(17, torsoY + 14, 14, 2, P.apronDark);
      px(23, torsoY + 14, 2, 2, P.goldBright);

      // --- 5. HEAD, BEARD, MUSTACHE & BERET HAT ---
      const hx = 15 + headTiltX;
      const hy = headY;

      // Medieval Bard Cap / Beret in wine & leather
      px(hx + 1, hy - 4, 16, 5, P.outline);
      px(hx + 2, hy - 3, 14, 4, P.vestWine);
      px(hx + 3, hy - 3, 10, 2, P.vestWineLight);
      // Golden feather / lute plume on cap
      px(hx + 14, hy - 6, 3, 4, P.goldBright);
      px(hx + 15, hy - 7, 2, 2, P.goldHighlight);

      // Head outline & ears
      px(hx + 1, hy, 16, 15, P.outline);
      px(hx, hy + 5, 18, 5, P.outline);
      px(hx + 1, hy + 6, 1, 3, P.skinShadow);
      px(hx + 16, hy + 6, 1, 3, P.skinShadow);

      // Hair sides
      px(hx + 2, hy + 1, 14, 3, P.hairMid);
      px(hx + 2, hy + 2, 2, 6, P.hairDark);
      px(hx + 14, hy + 2, 2, 6, P.hairDark);

      // Face skin
      px(hx + 3, hy + 3, 12, 10, P.skinBase);
      px(hx + 4, hy + 3, 10, 3, P.skinLight);
      // Rosy warm tavern cheeks
      px(hx + 4, hy + 8, 2, 2, P.cheek);
      px(hx + 12, hy + 8, 2, 2, P.cheek);

      // Eyebrows (raised if curious or celebrating)
      const browOffset = currentMood === 'curious' || currentMood === 'celebrate' ? -1 : 0;
      px(hx + 5, hy + 4 + browOffset, 3, 1, P.hairDark);
      px(hx + 10, hy + 4 + browOffset, 3, 1, P.hairDark);

      // Eyes (Blink vs Open vs Happy Arc)
      if (currentMood === 'celebrate') {
        // Joyful squinting eyes ^ ^
        px(hx + 5, hy + 6, 3, 1, P.eyePupil);
        px(hx + 10, hy + 6, 3, 1, P.eyePupil);
      } else if (isBlinking) {
        px(hx + 5, hy + 7, 3, 1, P.hairDark);
        px(hx + 10, hy + 7, 3, 1, P.hairDark);
      } else {
        const pupilShift = currentMood === 'curious' ? 1 : 0;
        px(hx + 5, hy + 6, 2, 2, P.eyeWhite);
        px(hx + 6 + pupilShift, hy + 6, 1, 2, P.eyePupil);

        px(hx + 10, hy + 6, 2, 2, P.eyeWhite);
        px(hx + 11 + pupilShift, hy + 6, 1, 2, P.eyePupil);
      }

      // Friendly nose
      px(hx + 8, hy + 7, 2, 2, P.skinShadow);

      // Full friendly beard & mustache
      px(hx + 2, hy + 10, 14, 6, P.outline);
      px(hx + 3, hy + 10, 12, 5, P.hairDark);
      px(hx + 4, hy + 10, 10, 3, P.hairMid);
      px(hx + 5, hy + 9, 8, 2, P.hairLight); // Mustache

      // Warm smile
      if (currentMood === 'celebrate' || currentMood === 'wave') {
        px(hx + 7, hy + 11, 4, 2, P.eyeWhite);
      } else {
        px(hx + 8, hy + 11, 2, 1, P.skinLight);
      }

      // --- 6. ARMS & HANDS (State-Driven Animations) ---
      // Left Arm (Screen Left): Waves on 'wave' or raises tankard on 'celebrate'
      if (currentMood === 'wave') {
        const waveShift = Math.sin(elapsed * 10) > 0 ? -2 : 0;
        // Raised waving arm
        px(6, torsoY - 3 + waveShift, 6, 9, P.outline);
        px(7, torsoY - 2 + waveShift, 4, 6, P.shirtBase);
        px(7, torsoY - 5 + waveShift, 4, 3, P.skinBase);
        px(8, torsoY - 5 + waveShift, 2, 2, P.skinLight);
      } else if (currentMood === 'celebrate') {
        const cheerBob = Math.sin(elapsed * 12) > 0 ? -2 : 0;
        // Raised arm holding wooden tavern mug with foam!
        px(5, torsoY - 5 + cheerBob, 6, 10, P.outline);
        px(6, torsoY - 4 + cheerBob, 4, 7, P.shirtLight);
        // Wooden & brass tankard
        px(3, torsoY - 12 + cheerBob, 8, 8, P.outline);
        px(4, torsoY - 11 + cheerBob, 6, 6, P.mugWood);
        px(4, torsoY - 9 + cheerBob, 6, 1, P.goldBright);
        px(4, torsoY - 12 + cheerBob, 6, 2, P.mugFoam);
      } else {
        // Resting on oak counter
        px(9, torsoY + 4, 5, 11, P.outline);
        px(10, torsoY + 5, 3, 8, P.shirtBase);
        px(10, torsoY + 12, 4, 3, P.skinBase);
      }

      // Right Arm (Screen Right): Holds feather quill on 'curious' or cheers on 'celebrate'
      if (currentMood === 'curious') {
        const writeTick = Math.sin(elapsed * 9) > 0 ? 1 : 0;
        px(34, torsoY + 3, 6, 10, P.outline);
        px(35, torsoY + 4, 4, 7, P.shirtBase);
        px(35 + writeTick, torsoY + 10, 4, 3, P.skinBase);
        // Golden feather quill in hand
        px(38 + writeTick, torsoY + 5, 2, 5, P.goldBright);
        px(39 + writeTick, torsoY + 3, 2, 3, P.shirtLight);
      } else if (currentMood === 'celebrate') {
        const cheerBob = Math.sin(elapsed * 12) > 0 ? -1 : 1;
        px(35, torsoY - 3 + cheerBob, 6, 9, P.outline);
        px(36, torsoY - 2 + cheerBob, 4, 6, P.shirtLight);
        px(36, torsoY - 4 + cheerBob, 4, 3, P.skinLight);
      } else {
        // Resting warmly on counter
        px(34, torsoY + 4, 5, 11, P.outline);
        px(35, torsoY + 5, 3, 8, P.shirtBase);
        px(34, torsoY + 12, 4, 3, P.skinBase);
      }

      // --- 7. FLOATING PIXEL MUSICAL NOTES (On Celebrate or Wave) ---
      if (currentMood === 'celebrate' || currentMood === 'wave') {
        const noteY = Math.floor((elapsed * 8) % 6);
        // Pixel eighth-note 1
        px(5, 9 - noteY, 2, 2, P.noteGold);
        px(6, 5 - noteY, 1, 4, P.noteGold);
        px(7, 5 - noteY, 2, 1, P.noteGold);

        // Pixel eighth-note 2
        px(40, 11 - noteY, 2, 2, P.goldHighlight);
        px(41, 7 - noteY, 1, 4, P.goldHighlight);
        px(42, 7 - noteY, 2, 1, P.goldHighlight);
      }

      timerId = window.setTimeout(() => {
        if (!disposed) animId = requestAnimationFrame(renderFrame);
      }, 110);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Speech Bubble in Warm Parchment Manuscript Style */}
      <div
        className="mb-1.5 max-w-[270px] sm:max-w-[320px] px-3.5 py-2 rounded-md border border-[#9e7b1c]/70 bg-[#f4ebd9] text-[#26160c] shadow-[0_6px_20px_rgba(0,0,0,0.65)] transition-all duration-200"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs sm:text-sm font-medium leading-snug text-center italic">
          “{speechText}”
        </p>
        {/* Small speech pointer */}
        <div
          className="mx-auto w-2.5 h-2.5 rotate-45 bg-[#f4ebd9] border-r border-b border-[#9e7b1c]/70 -mb-3 mt-0.5"
          aria-hidden="true"
        />
      </div>

      {/* Interactive 16-bit Pixel Art Mascot Button */}
      <button
        type="button"
        onClick={onWaveTrigger}
        aria-label="Acenar para Barnaby, o atendente da Taverna Musical"
        title="Clique para cumprimentar Barnaby"
        className="group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a738] rounded-lg cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
      >
        {/* Warm golden candle halo behind the bartender */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-full opacity-55 group-hover:opacity-80 transition-opacity"
          style={{
            background:
              'radial-gradient(circle, rgba(217,167,56,0.28) 0%, rgba(107,29,47,0.08) 55%, transparent 75%)',
          }}
          aria-hidden="true"
        />

        <canvas
          ref={canvasRef}
          width={48}
          height={52}
          data-testid="pixel-mascot-canvas"
          className="pixel-canvas w-[112px] h-[121px] sm:w-[132px] sm:h-[143px] drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)]"
        />

        <span className="mt-0.5 px-2.5 py-0.5 text-[11px] font-display tracking-wider text-[#f4ebd9] bg-[#24130b]/95 border border-[#9e7b1c]/60 rounded shadow">
          Barnaby · Anfitrião da Taverna
        </span>
      </button>
    </div>
  );
};
