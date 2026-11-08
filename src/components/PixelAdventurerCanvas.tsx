import React, { useEffect, useRef } from 'react';
import {
  AdventurerAnimation,
  AdventurerAppearance,
  CLOAK_PALETTES,
  EYE_COLORS,
  HAIR_PALETTES,
  OUTFIT_PALETTES,
  SKIN_PALETTES,
} from '../utils/characterLogic';

export interface DrawPixelAdventurerOptions {
  appearance: AdventurerAppearance;
  animation: AdventurerAnimation;
  facing: 'left' | 'right';
  vertical?: 'front' | 'back';
  timeSec: number;
}

/**
 * Stardew Valley-inspired 16-bit pixel art adventurer sprite renderer onto a 48x56 local grid.
 * Features rounded head contours, warm dark-espresso selective outlines, expressive eyes with catchlights,
 * rosy cheek pixels, layered hair shading, and 8 animations (including 'stand_up').
 */
export function drawPixelAdventurerSprite(
  ctx: CanvasRenderingContext2D,
  options: DrawPixelAdventurerOptions
): void {
  const {
    appearance: app,
    animation: anim,
    facing: dir,
    vertical = 'front',
    timeSec: t,
  } = options;

  const skin = SKIN_PALETTES[app.skinTone] || SKIN_PALETTES.peach;
  const hair = HAIR_PALETTES[app.hairColor] || HAIR_PALETTES.oak_brown;
  const eyeColor = EYE_COLORS[app.eyeColor] || EYE_COLORS.amber_gold;
  const outfit = OUTFIT_PALETTES[app.outfit] || OUTFIT_PALETTES.bard_tunic;
  const cloak = CLOAK_PALETTES[app.cloak] || CLOAK_PALETTES.none;

  const OUTLINE = '#1e0d07';
  const OUTLINE_SOFT = '#33190f';
  const GOLD = '#d9a738';
  const GOLD_LIGHT = '#f7d87c';
  const WOOD_DARK = '#3b2214';
  const WOOD_MID = '#6e4226';
  const WOOD_LIGHT = '#9c6239';

  ctx.save();

  if (dir === 'left') {
    ctx.translate(48, 0);
    ctx.scale(-1, 1);
  }

  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // --- ANIMATION KINEMATICS ---
  const isBlinking =
    (t % 3.6) > 3.44 && anim !== 'celebrate' && anim !== 'negative';
  const walkStep = Math.floor(t * 7.5) % 4; // 0, 1, 2, 3
  const danceStep = Math.floor(t * 6) % 4;
  const standPhase = (t * 2.4) % 1; // 0..1 rising motion

  let bodyOffsetX = 0;
  let bodyOffsetY = 0;
  let headShakeX = 0;

  if (anim === 'idle') {
    bodyOffsetY = Math.sin(t * 3.0) > 0.3 ? 1 : 0;
  } else if (anim === 'walk') {
    bodyOffsetY = walkStep % 2 === 1 ? -1 : 0;
  } else if (anim === 'sit') {
    bodyOffsetY = 5;
  } else if (anim === 'stand_up') {
    // Rising from seated position with a brisk upward hop
    bodyOffsetY = standPhase < 0.35 ? 3 : standPhase < 0.7 ? -1 : 0;
  } else if (anim === 'interact') {
    bodyOffsetY = Math.sin(t * 5) > 0 ? 0 : 1;
  } else if (anim === 'celebrate') {
    bodyOffsetY = Math.sin(t * 10) > 0 ? -2 : 0;
  } else if (anim === 'negative') {
    bodyOffsetY = 1;
    headShakeX = Math.sin(t * 12) > 0 ? 1 : -1;
  } else if (anim === 'dance') {
    bodyOffsetX = danceStep === 0 ? -1 : danceStep === 2 ? 1 : 0;
    bodyOffsetY = danceStep % 2 === 1 ? -1 : 0;
  }

  const bx = 14 + bodyOffsetX;
  const by = 22 + bodyOffsetY;
  const hx = 15 + bodyOffsetX + headShakeX;
  const hy = 6 + bodyOffsetY;

  // --- 0. GROUND DROP SHADOW (Coherent Stardew oval shadow) ---
  px(13, 50, 22, 3, 'rgba(14, 7, 3, 0.48)');
  px(15, 49, 18, 5, 'rgba(14, 7, 3, 0.35)');

  // --- 1. WOODEN TAVERN STOOL (When sitting or standing up) ---
  if (anim === 'sit' || (anim === 'stand_up' && standPhase < 0.5)) {
    px(13, 42, 22, 4, OUTLINE);
    px(14, 42, 20, 1, WOOD_LIGHT);
    px(14, 43, 20, 2, WOOD_MID);
    px(15, 45, 3, 7, OUTLINE);
    px(16, 45, 2, 6, WOOD_DARK);
    px(30, 45, 3, 7, OUTLINE);
    px(30, 45, 2, 6, WOOD_DARK);
    px(17, 48, 14, 2, WOOD_DARK);
  }

  // --- 2. BACK LUTE ACCESSORY (When facing front) ---
  if (app.accessory === 'back_lute' && anim !== 'dance' && vertical === 'front') {
    px(bx + 15, by - 6, 6, 6, OUTLINE);
    px(bx + 16, by - 5, 4, 4, WOOD_MID);
    px(bx + 17, by - 7, 4, 2, GOLD);
    px(bx + 18, by - 8, 2, 1, GOLD_LIGHT);
  }

  // --- 3. BACK CLOAK / COAT LAYER (Underneath torso when facing front) ---
  if (app.cloak !== 'none' && vertical === 'front') {
    const cloakSwing =
      anim === 'walk' || anim === 'dance' ? (walkStep % 2 === 0 ? 1 : -1) : 0;
    // Rounded cloak silhouette
    px(bx - 2 + cloakSwing, by + 1, 24, 21, OUTLINE);
    px(bx - 3 + cloakSwing, by + 3, 26, 18, OUTLINE);
    px(bx - 2 + cloakSwing, by + 2, 24, 19, cloak.dark);
    px(bx - 1 + cloakSwing, by + 3, 22, 16, cloak.mid);
  }

  // --- 4. LEGS, TROUSERS & MEDIEVAL CUFFED BOOTS ---
  if (anim === 'sit') {
    px(bx + 3, by + 14, 6, 7, OUTLINE);
    px(bx + 4, by + 14, 4, 4, '#2e2018');
    px(bx + 3, by + 18, 6, 1, WOOD_LIGHT);
    px(bx + 3, by + 19, 6, 3, WOOD_DARK);

    px(bx + 11, by + 14, 6, 7, OUTLINE);
    px(bx + 12, by + 14, 4, 4, '#2e2018');
    px(bx + 11, by + 18, 6, 1, WOOD_LIGHT);
    px(bx + 11, by + 19, 6, 3, WOOD_DARK);
  } else if (anim === 'walk') {
    const leftUp = walkStep === 1 ? -2 : walkStep === 3 ? 1 : 0;
    const rightUp = walkStep === 3 ? -2 : walkStep === 1 ? 1 : 0;

    px(bx + 3, by + 16 + leftUp, 6, 12, OUTLINE);
    px(bx + 4, by + 16 + leftUp, 4, 6, '#2e2018');
    px(bx + 4, by + 22 + leftUp, 5, 1, WOOD_LIGHT);
    px(bx + 4, by + 23 + leftUp, 5, 4, WOOD_DARK);

    px(bx + 11, by + 16 + rightUp, 6, 12, OUTLINE);
    px(bx + 12, by + 16 + rightUp, 4, 6, '#2e2018');
    px(bx + 12, by + 22 + rightUp, 5, 1, WOOD_LIGHT);
    px(bx + 12, by + 23 + rightUp, 5, 4, WOOD_DARK);
  } else if (anim === 'dance') {
    const stepShift = danceStep % 2 === 0 ? -1 : 1;
    px(bx + 2 + stepShift, by + 16, 6, 12, OUTLINE);
    px(bx + 3 + stepShift, by + 16, 4, 6, '#2e2018');
    px(bx + 3 + stepShift, by + 22, 5, 1, WOOD_LIGHT);
    px(bx + 3 + stepShift, by + 23, 5, 4, WOOD_DARK);

    px(bx + 12 - stepShift, by + 16, 6, 12, OUTLINE);
    px(bx + 13 - stepShift, by + 16, 4, 6, '#2e2018');
    px(bx + 13 - stepShift, by + 22, 5, 1, WOOD_LIGHT);
    px(bx + 13 - stepShift, by + 23, 5, 4, WOOD_DARK);
  } else {
    const kneeBend = anim === 'stand_up' && standPhase < 0.4 ? -1 : 0;
    px(bx + 3, by + 16 + kneeBend, 6, 13 - kneeBend, OUTLINE);
    px(bx + 4, by + 16 + kneeBend, 4, 7, '#2e2018');
    px(bx + 4, by + 23, 5, 1, WOOD_LIGHT);
    px(bx + 4, by + 24, 5, 4, WOOD_DARK);

    px(bx + 11, by + 16 + kneeBend, 6, 13 - kneeBend, OUTLINE);
    px(bx + 12, by + 16 + kneeBend, 4, 7, '#2e2018');
    px(bx + 12, by + 23, 5, 1, WOOD_LIGHT);
    px(bx + 12, by + 24, 5, 4, WOOD_DARK);
  }

  // --- 5. TORSO & STARDEW-INSPIRED MEDIEVAL TUNIC / DOUBLET ---
  // Rounded shoulders (1px inset on top row)
  px(bx + 2, by, 16, 1, OUTLINE);
  px(bx + 1, by + 1, 18, 16, OUTLINE);
  px(bx + 2, by + 1, 16, 15, outfit.dark);
  px(bx + 3, by + 1, 14, 13, outfit.mid);
  px(bx + 4, by + 2, 10, 9, outfit.light);

  if (vertical === 'front') {
    // Cream undershirt collar & medieval gold lacing
    px(bx + 7, by + 1, 6, 4, outfit.shirt);
    px(bx + 8, by + 5, 4, 2, outfit.shirt);
    px(bx + 6, by + 1, 1, 6, outfit.trim);
    px(bx + 13, by + 1, 1, 6, outfit.trim);
    px(bx + 9, by + 3, 2, 1, GOLD);
    px(bx + 9, by + 5, 2, 1, GOLD);

    // Belt with brass buckle & pouch
    px(bx + 2, by + 12, 16, 3, OUTLINE);
    px(bx + 3, by + 12, 14, 2, WOOD_DARK);
    px(bx + 8, by + 12, 4, 2, GOLD);
    px(bx + 9, by + 12, 2, 1, GOLD_LIGHT);
    px(bx + 14, by + 13, 3, 3, WOOD_MID);

    if (app.cloak !== 'none') {
      px(bx + 1, by, 5, 4, cloak.mid);
      px(bx + 2, by + 1, 3, 2, cloak.clasp);
      px(bx + 14, by, 5, 4, cloak.mid);
      px(bx + 15, by + 1, 3, 2, cloak.clasp);
      px(bx + 6, by + 2, 8, 1, cloak.clasp);
      px(bx + 9, by + 1, 2, 2, GOLD_LIGHT);
    }
  } else {
    // Back view tunic seam, cloak & lute
    px(bx + 9, by + 2, 2, 10, outfit.dark);
    px(bx + 2, by + 12, 16, 2, WOOD_DARK);
    if (app.cloak !== 'none') {
      const cloakSwing =
        anim === 'walk' || anim === 'dance' ? (walkStep % 2 === 0 ? 1 : -1) : 0;
      px(bx - 1 + cloakSwing, by, 22, 1, OUTLINE);
      px(bx - 2 + cloakSwing, by + 1, 24, 20, OUTLINE);
      px(bx - 1 + cloakSwing, by + 1, 22, 19, cloak.dark);
      px(bx + 1 + cloakSwing, by + 2, 18, 16, cloak.mid);
      px(bx + 3 + cloakSwing, by + 3, 14, 4, cloak.clasp);
    }
    if (app.accessory === 'back_lute') {
      px(bx + 5, by + 2, 10, 11, OUTLINE);
      px(bx + 6, by + 3, 8, 9, '#b85d19');
      px(bx + 7, by + 4, 6, 7, '#d97a2b');
      px(bx + 8, by + 6, 4, 4, GOLD);
      px(bx + 12, by - 5, 4, 8, WOOD_MID);
    }
  }

  // --- 6. ROUNDED STARDEW-STYLE HEAD, EARS, EXPRESSIVE EYES & BLUSH ---
  // Rounded head contour (omitting sharp corners for authentic 16-bit charm)
  px(hx + 3, hy, 12, 1, OUTLINE);
  px(hx + 2, hy + 1, 14, 1, OUTLINE);
  px(hx + 1, hy + 2, 16, 12, OUTLINE);
  px(hx + 2, hy + 14, 14, 1, OUTLINE);
  px(hx + 3, hy + 15, 12, 1, OUTLINE);

  // Ears
  px(hx, hy + 6, 2, 4, OUTLINE);
  px(hx + 16, hy + 6, 2, 4, OUTLINE);
  px(hx + 1, hy + 7, 1, 2, skin.shadow);
  px(hx + 16, hy + 7, 1, 2, skin.shadow);

  if (vertical === 'back') {
    // Back of head / full hair volume
    px(hx + 2, hy + 2, 14, 12, app.hairStyle === 'bald' ? skin.base : hair.dark);
    if (app.hairStyle !== 'bald') {
      px(hx + 3, hy + 2, 12, 11, hair.mid);
      px(hx + 4, hy + 3, 10, 5, hair.light);
      px(hx + 5, hy + 10, 8, 3, hair.dark);
    }
  } else {
    // Face base with warm forehead highlight & soft chin shading
    px(hx + 2, hy + 2, 14, 12, skin.base);
    px(hx + 3, hy + 1, 12, 1, skin.base);
    px(hx + 3, hy + 14, 12, 1, skin.shadow);
    px(hx + 3, hy + 2, 12, 4, skin.light);
    px(hx + 2, hy + 12, 14, 2, skin.shadow);

    // Signature Stardew warm rosy cheek blush pixels
    px(hx + 3, hy + 9, 2, 2, 'rgba(219, 101, 88, 0.55)');
    px(hx + 13, hy + 9, 2, 2, 'rgba(219, 101, 88, 0.55)');

    // CheekScar accessory
    if (app.accessory === 'cheek_scar') {
      px(hx + 12, hy + 7, 1, 4, '#8c2b40');
      px(hx + 11, hy + 8, 3, 1, '#8c2b40');
    }

    // Eyebrows based on expression + animation
    const isNegative = anim === 'negative';
    const isHappy =
      anim === 'celebrate' || anim === 'dance' || app.expression === 'cheerful';
    const browY = hy + (isHappy ? 4 : 5);

    if (isNegative || app.expression === 'determined') {
      px(hx + 4, browY, 2, 1, hair.dark);
      px(hx + 6, browY + 1, 1, 1, hair.dark);
      px(hx + 11, browY + 1, 1, 1, hair.dark);
      px(hx + 12, browY, 2, 1, hair.dark);
    } else if (app.expression === 'curious') {
      px(hx + 4, browY - 1, 3, 1, hair.dark);
      px(hx + 11, browY, 3, 1, hair.dark);
    } else {
      px(hx + 4, browY, 3, 1, hair.dark);
      px(hx + 11, browY, 3, 1, hair.dark);
    }

    // Expressive 2x3 Stardew-style Eyes with 1x1 white catchlights
    if (anim === 'celebrate' || anim === 'dance') {
      // Happy curved eye arcs
      px(hx + 4, hy + 7, 1, 1, OUTLINE);
      px(hx + 5, hy + 6, 2, 1, OUTLINE);
      px(hx + 11, hy + 6, 2, 1, OUTLINE);
      px(hx + 13, hy + 7, 1, 1, OUTLINE);
    } else if (isBlinking || app.expression === 'serene') {
      px(hx + 4, hy + 8, 3, 1, OUTLINE_SOFT);
      px(hx + 11, hy + 8, 3, 1, OUTLINE_SOFT);
    } else {
      // Left Eye
      px(hx + 4, hy + 6, 3, 3, '#faf5e8');
      px(hx + 5, hy + 6, 2, 3, eyeColor);
      px(hx + 5, hy + 7, 2, 2, OUTLINE);
      px(hx + 5, hy + 6, 1, 1, '#ffffff'); // Catchlight

      // Right Eye
      px(hx + 11, hy + 6, 3, 3, '#faf5e8');
      px(hx + 12, hy + 6, 2, 3, eyeColor);
      px(hx + 12, hy + 7, 2, 2, OUTLINE);
      px(hx + 12, hy + 6, 1, 1, '#ffffff'); // Catchlight
    }

    // Cute pixel button nose
    px(hx + 8, hy + 8, 2, 2, skin.shadow);

    // Facial Hair (Bard Beard)
    if (app.accessory === 'bard_beard') {
      px(hx + 3, hy + 11, 12, 4, hair.dark);
      px(hx + 4, hy + 11, 10, 3, hair.mid);
      px(hx + 5, hy + 10, 8, 1, hair.light);
    }

    // Mouth
    if (isNegative) {
      px(hx + 7, hy + 12, 4, 1, OUTLINE);
      px(hx + 6, hy + 13, 1, 1, OUTLINE);
      px(hx + 11, hy + 13, 1, 1, OUTLINE);
    } else if (isHappy) {
      px(hx + 7, hy + 11, 4, 2, OUTLINE);
      px(hx + 8, hy + 11, 2, 1, '#faf5e8');
      px(hx + 6, hy + 11, 1, 1, OUTLINE_SOFT);
      px(hx + 11, hy + 11, 1, 1, OUTLINE_SOFT);
    } else if (app.expression === 'curious') {
      px(hx + 8, hy + 11, 2, 2, OUTLINE);
    } else {
      px(hx + 7, hy + 12, 4, 1, OUTLINE_SOFT);
      px(hx + 11, hy + 11, 1, 1, OUTLINE_SOFT);
    }

    // Glasses / Monocle
    if (app.accessory === 'round_glasses') {
      px(hx + 3, hy + 5, 5, 5, GOLD);
      px(hx + 4, hy + 6, 3, 3, eyeColor);
      px(hx + 4, hy + 6, 1, 1, '#ffffff');
      px(hx + 10, hy + 5, 5, 5, GOLD);
      px(hx + 11, hy + 6, 3, 3, eyeColor);
      px(hx + 11, hy + 6, 1, 1, '#ffffff');
      px(hx + 8, hy + 7, 2, 1, GOLD);
    } else if (app.accessory === 'brass_monocle') {
      px(hx + 10, hy + 5, 5, 5, GOLD_LIGHT);
      px(hx + 11, hy + 6, 3, 3, eyeColor);
      px(hx + 11, hy + 6, 1, 1, '#ffffff');
      px(hx + 14, hy + 10, 1, 4, GOLD);
    }
  }

  // --- 7. LAYERED HAIR STYLE & SHADING ---
  if (app.hairStyle !== 'bald') {
    // Rounded crown of hair
    px(hx + 2, hy - 1, 14, 2, OUTLINE);
    px(hx + 1, hy, 16, 3, OUTLINE);
    px(hx + 2, hy, 14, 3, hair.mid);
    px(hx + 4, hy, 10, 2, hair.light);

    if (app.hairStyle === 'short_bard') {
      px(hx + 1, hy + 2, 2, 5, hair.dark);
      px(hx + 15, hy + 2, 2, 5, hair.dark);
      if (vertical === 'front') {
        px(hx + 3, hy + 2, 5, 2, hair.mid);
        px(hx + 4, hy + 2, 3, 1, hair.light);
        px(hx + 11, hy + 2, 4, 2, hair.mid);
      }
    } else if (app.hairStyle === 'long_wavy') {
      px(hx, hy + 2, 3, 13, OUTLINE);
      px(hx + 1, hy + 2, 2, 12, hair.mid);
      px(hx + 1, hy + 4, 1, 6, hair.light);
      px(hx + 15, hy + 2, 3, 13, OUTLINE);
      px(hx + 15, hy + 2, 2, 12, hair.mid);
      if (vertical === 'front') {
        px(hx + 3, hy + 2, 4, 2, hair.mid);
        px(hx + 12, hy + 2, 3, 2, hair.mid);
      }
    } else if (app.hairStyle === 'traveler_bun') {
      px(hx + 5, hy - 4, 8, 4, OUTLINE);
      px(hx + 6, hy - 3, 6, 3, hair.mid);
      px(hx + 7, hy - 3, 4, 1, hair.light);
      px(hx + 6, hy - 1, 6, 1, GOLD);
      px(hx + 1, hy + 2, 2, 4, hair.dark);
      px(hx + 15, hy + 2, 2, 4, hair.dark);
    } else if (app.hairStyle === 'braids') {
      px(hx + 1, hy + 2, 2, 14, hair.dark);
      px(hx + 1, hy + 5, 2, 2, hair.mid);
      px(hx + 1, hy + 9, 2, 2, hair.mid);
      px(hx + 1, hy + 14, 2, 1, GOLD);
      px(hx + 15, hy + 2, 2, 14, hair.dark);
      px(hx + 15, hy + 5, 2, 2, hair.mid);
      px(hx + 15, hy + 9, 2, 2, hair.mid);
      px(hx + 15, hy + 14, 2, 1, GOLD);
    } else if (app.hairStyle === 'mohawk') {
      px(hx + 6, hy - 5, 6, 5, OUTLINE);
      px(hx + 7, hy - 4, 4, 4, hair.mid);
      px(hx + 8, hy - 4, 2, 3, hair.light);
    }
  }

  // --- 8. HATS & HEADGEAR ---
  if (app.hat === 'bard_beret') {
    px(hx + 1, hy - 4, 16, 1, OUTLINE);
    px(hx, hy - 3, 18, 4, OUTLINE);
    px(hx + 1, hy - 3, 16, 3, outfit.mid);
    px(hx + 3, hy - 3, 11, 2, outfit.light);
    // Plume feather
    px(hx + 14, hy - 7, 3, 5, GOLD);
    px(hx + 15, hy - 8, 2, 3, GOLD_LIGHT);
  } else if (app.hat === 'ranger_hat') {
    px(hx - 3, hy - 2, 24, 3, OUTLINE);
    px(hx - 2, hy - 1, 22, 2, WOOD_DARK);
    px(hx + 2, hy - 6, 14, 5, OUTLINE);
    px(hx + 3, hy - 5, 12, 4, WOOD_MID);
    px(hx + 4, hy - 5, 8, 2, WOOD_LIGHT);
    px(hx + 3, hy - 2, 12, 1, GOLD);
  } else if (app.hat === 'pilgrim_hood') {
    px(hx, hy - 3, 18, 1, OUTLINE);
    px(hx - 1, hy - 2, 20, 5, OUTLINE);
    px(hx, hy - 2, 18, 4, outfit.dark);
    px(hx + 2, hy - 2, 14, 2, outfit.mid);
    px(hx - 1, hy + 2, 3, 12, outfit.dark);
    px(hx + 16, hy + 2, 3, 12, outfit.dark);
  } else if (app.hat === 'gold_circlet') {
    px(hx + 1, hy + 1, 16, 2, GOLD);
    px(hx + 4, hy + 1, 10, 1, GOLD_LIGHT);
    if (vertical === 'front') px(hx + 8, hy, 2, 3, '#9e1f37');
  } else if (app.hat === 'bandana') {
    px(hx + 1, hy - 1, 16, 3, '#6b1d2f');
    px(hx + 2, hy, 14, 1, '#a6324c');
    px(hx - 1, hy, 2, 4, '#6b1d2f');
  }

  // --- 9. ARMS, HANDS & INTERACTIVE PROPS ---
  if (anim === 'celebrate') {
    px(bx - 5, by - 5, 6, 10, OUTLINE);
    px(bx - 4, by - 4, 4, 7, outfit.shirt);
    // Frothy oak tankard raised high
    px(bx - 7, by - 12, 8, 8, OUTLINE);
    px(bx - 6, by - 11, 6, 6, WOOD_MID);
    px(bx - 5, by - 11, 2, 6, WOOD_LIGHT);
    px(bx - 6, by - 9, 6, 1, GOLD);
    px(bx - 6, by - 12, 6, 2, '#faf5e8');

    px(bx + 19, by - 4, 5, 9, OUTLINE);
    px(bx + 20, by - 3, 3, 6, outfit.shirt);
    px(bx + 20, by - 5, 3, 2, skin.base);
  } else if (anim === 'dance') {
    const strumY = danceStep % 2 === 0 ? 0 : 1;
    px(bx - 3, by + 3, 5, 9, OUTLINE);
    px(bx - 2, by + 4, 3, 6, outfit.shirt);
    px(bx + 18, by + 2, 5, 9, OUTLINE);
    px(bx + 19, by + 3, 3, 6, outfit.shirt);

    if (vertical === 'front') {
      px(bx + 2, by + 5, 13, 8, OUTLINE);
      px(bx + 3, by + 6, 11, 6, '#b85d19');
      px(bx + 4, by + 6, 9, 3, '#d97a2b');
      px(bx + 5, by + 7, 7, 4, GOLD);
      px(bx + 7, by + 8, 2, 2, OUTLINE);
      px(bx + 14, by + 2, 8, 3, WOOD_MID);
      px(bx + 6, by + 6 + strumY, 3, 2, skin.light);
    }
  } else if (anim === 'interact') {
    px(bx - 3, by + 2, 4, 11, OUTLINE);
    px(bx - 2, by + 3, 3, 8, outfit.shirt);
    px(bx - 2, by + 10, 3, 3, skin.base);

    const reach = Math.sin(t * 8) > 0 ? 1 : 0;
    px(bx + 18, by + 1, 8 + reach, 5, OUTLINE);
    px(bx + 18, by + 2, 6 + reach, 3, outfit.shirt);
    px(bx + 24 + reach, by + 2, 3, 3, skin.base);
    px(bx + 26 + reach, by - 3, 2, 5, GOLD);
    px(bx + 27 + reach, by - 5, 2, 3, GOLD_LIGHT);
  } else if (anim === 'stand_up') {
    // Bracing arms slightly outward while rising from stool
    px(bx - 4, by + 3, 5, 10, OUTLINE);
    px(bx - 3, by + 4, 3, 7, outfit.shirt);
    px(bx - 3, by + 10, 3, 2, skin.base);

    px(bx + 19, by + 3, 5, 10, OUTLINE);
    px(bx + 20, by + 4, 3, 7, outfit.shirt);
    px(bx + 20, by + 10, 3, 2, skin.base);
  } else if (anim === 'negative') {
    px(bx - 3, by + 4, 4, 11, OUTLINE);
    px(bx - 2, by + 5, 3, 8, outfit.shirt);
    px(bx - 2, by + 12, 3, 2, skin.shadow);

    px(bx + 19, by + 4, 4, 11, OUTLINE);
    px(bx + 19, by + 5, 3, 8, outfit.shirt);
    px(bx + 19, by + 12, 3, 2, skin.shadow);
  } else if (anim === 'walk') {
    const armSwing = walkStep === 1 ? -2 : walkStep === 3 ? 2 : 0;
    px(bx - 3, by + 2 + armSwing, 4, 11, OUTLINE);
    px(bx - 2, by + 3 + armSwing, 3, 8, outfit.shirt);
    px(bx - 2, by + 10 + armSwing, 3, 2, skin.base);

    px(bx + 19, by + 2 - armSwing, 4, 11, OUTLINE);
    px(bx + 19, by + 3 - armSwing, 3, 8, outfit.shirt);
    px(bx + 19, by + 10 - armSwing, 3, 2, skin.base);
  } else {
    px(bx - 3, by + 2, 4, 11, OUTLINE);
    px(bx - 2, by + 3, 3, 8, outfit.shirt);
    px(bx - 2, by + 10, 3, 3, skin.base);

    px(bx + 19, by + 2, 4, 11, OUTLINE);
    px(bx + 19, by + 3, 3, 8, outfit.shirt);
    px(bx + 19, by + 10, 3, 3, skin.base);
  }

  // --- 10. EMOTE / MUSICAL PIXEL PARTICLES ---
  const floatY = Math.floor((t * 6) % 5);
  if (anim === 'celebrate' || anim === 'dance') {
    px(4, 10 - floatY, 2, 2, GOLD_LIGHT);
    px(5, 6 - floatY, 1, 4, GOLD_LIGHT);
    px(6, 6 - floatY, 2, 1, GOLD_LIGHT);

    px(40, 12 - floatY, 2, 2, GOLD);
    px(41, 8 - floatY, 1, 4, GOLD);
    px(42, 8 - floatY, 2, 1, GOLD);
  } else if (anim === 'negative') {
    px(36, 4, 8, 4, '#28201b');
    px(38, 3, 5, 2, '#3d322c');
    px(39, 9 + (floatY % 2), 1, 2, '#8ab4d6');
    px(42, 10 + (floatY % 2), 1, 2, '#8ab4d6');
  } else if (anim === 'interact') {
    px(41, 14 - (floatY % 3), 2, 2, GOLD_LIGHT);
    px(40, 15 - (floatY % 3), 4, 1, GOLD);
  }

  ctx.restore();
}

interface PixelAdventurerCanvasProps {
  appearance: AdventurerAppearance;
  animation: AdventurerAnimation;
  facing?: 'left' | 'right';
  vertical?: 'front' | 'back';
  scale?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Modular 16-bit RPG Pixel Art Adventurer Sprite Renderer (`48x56` native grid).
 */
export const PixelAdventurerCanvas: React.FC<PixelAdventurerCanvasProps> = ({
  appearance,
  animation,
  facing = 'right',
  vertical = 'front',
  scale = 'lg',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ appearance, animation, facing, vertical });

  useEffect(() => {
    stateRef.current = { appearance, animation, facing, vertical };
  }, [appearance, animation, facing, vertical]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animId = 0;
    let timerId = 0;
    let disposed = false;
    const startTime = performance.now();

    const drawFrame = (now: number) => {
      if (disposed) return;
      const t = (now - startTime) / 1000;
      const { appearance: app, animation: anim, facing: dir, vertical: vert } = stateRef.current;

      ctx.clearRect(0, 0, 48, 56);
      drawPixelAdventurerSprite(ctx, {
        appearance: app,
        animation: anim,
        facing: dir,
        vertical: vert,
        timeSec: t,
      });

      timerId = window.setTimeout(() => {
        if (!disposed) animId = requestAnimationFrame(drawFrame);
      }, 95);
    };

    animId = requestAnimationFrame(drawFrame);
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
    };
  }, []);

  const sizeClasses =
    scale === 'sm'
      ? 'w-[72px] h-[84px]'
      : scale === 'md'
      ? 'w-[108px] h-[126px]'
      : scale === 'xl'
      ? 'w-[168px] h-[196px] sm:w-[192px] sm:h-[224px]'
      : 'w-[132px] h-[154px]';

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={56}
      data-testid="pixel-adventurer-canvas"
      className={`pixel-canvas ${sizeClasses} drop-shadow-[0_10px_14px_rgba(0,0,0,0.85)] ${className}`}
    />
  );
};
