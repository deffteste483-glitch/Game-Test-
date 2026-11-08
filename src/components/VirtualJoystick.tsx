import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onChangeVector: (vx: number, vy: number) => void;
}

/**
 * Medieval Brass & Leather Virtual Joystick for 8-directional free movement on mobile/touch
 * and pointer devices. Emits normalized (vx, vy) in [-1, 1].
 */
export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onChangeVector }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const MAX_RADIUS = 30;

  const updateFromClientCoords = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 3) {
      setKnobPos({ x: 0, y: 0 });
      onChangeVector(0, 0);
      return;
    }

    const clampedDist = Math.min(MAX_RADIUS, dist);
    const nx = dx / dist;
    const ny = dy / dist;

    setKnobPos({
      x: nx * clampedDist,
      y: ny * clampedDist,
    });

    const magnitude = clampedDist / MAX_RADIUS;
    onChangeVector(nx * magnitude, ny * magnitude);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    e.stopPropagation();
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const resetStick = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onChangeVector(0, 0);
  };

  return (
    <div
      ref={baseRef}
      data-testid="virtual-joystick"
      role="slider"
      aria-label="Joystick Virtual de Movimentação em 8 Direções"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={Math.round(Math.hypot(knobPos.x, knobPos.y))}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={resetStick}
      onPointerCancel={resetStick}
      className="relative w-24 h-24 rounded-full border-2 border-[#c59b27]/85 bg-[#1b0e08]/90 shadow-[0_6px_20px_rgba(0,0,0,0.9),inset_0_0_14px_rgba(217,167,56,0.2)] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
    >
      {/* Compass Cardinal Etchings */}
      <span className="pointer-events-none absolute top-1 text-[9px] font-display font-bold text-[#d9a738]/75">
        N
      </span>
      <span className="pointer-events-none absolute bottom-1 text-[9px] font-display font-bold text-[#d9a738]/75">
        S
      </span>
      <span className="pointer-events-none absolute left-1.5 text-[9px] font-display font-bold text-[#d9a738]/75">
        O
      </span>
      <span className="pointer-events-none absolute right-1.5 text-[9px] font-display font-bold text-[#d9a738]/75">
        L
      </span>

      {/* Inner Brass Ring */}
      <div className="pointer-events-none w-14 h-14 rounded-full border border-[#9e7b1c]/40 bg-[#28150c]/70" />

      {/* Movable Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className={`pointer-events-none absolute w-9 h-9 rounded-full border-2 transition-transform duration-75 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.85)] ${
          active
            ? 'border-[#f7d87c] bg-[#82243a] scale-105'
            : 'border-[#d9a738] bg-[#6b1d2f]'
        }`}
      >
        <div className="w-3 h-3 rounded-full bg-[#f7d87c]/80" />
      </div>
    </div>
  );
};
