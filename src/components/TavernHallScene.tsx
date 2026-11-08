import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Music,
  Flame,
  BookOpen,
  Sparkles,
  UserCog,
  Compass,
  Volume2,
  VolumeX,
  ScrollText,
  DoorOpen,
  UtensilsCrossed,
  Navigation,
  Sliders,
  ShoppingBag,
  Layers,
  Award,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  ANIMATION_META,
  AdventurerAnimation,
  AdventurerAppearance,
} from '../utils/characterLogic';
import {
  GRID_ROWS,
  INITIAL_PLAYER_STATE,
  NpcRuntimeState,
  PlayerPhysicsState,
  TAVERN_INTERACTIVE_STATIONS,
  TAVERN_NPCS,
  TAVERN_OBSTACLES,
  TAVERN_SEAT_STOOLS,
  TILE_SIZE,
  TavernInteractiveStation,
  TavernSeatStool,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  Waypoint,
  WorldObstacle,
  findNearestInteractable,
  findPathAStar,
  getNpcRuntimeState,
  sortRenderablesByDepth,
  stepCameraLerp,
  stepFreeMovementPhysics,
  stepPathFollowing,
} from '../utils/tavernWorldLogic';
import { AudioMixerState, TravelerAccount, clampVolume } from '../utils/authLogic';
import { SoundEffectType } from '../utils/soundEngine';
import { drawPixelAdventurerSprite } from './PixelAdventurerCanvas';
import { VirtualJoystick } from './VirtualJoystick';
import { CollectibleArtistPreview } from './CollectibleArtistPreview';
import { MuralDeAvisos } from './MuralDeAvisos';
import { TavernQuizModal } from './TavernQuizModal';
import {
  PlayerProgressionState,
  QUIZ_ARTISTS_DB,
  loadPlayerProgression,
  recordQuizResultForPlayer,
} from '../utils/quizCatalogAndLogic';

interface TavernHallSceneProps {
  traveler: TravelerAccount;
  appearance: AdventurerAppearance;
  mixer?: AudioMixerState;
  onChangeMixer?: (updated: AudioMixerState) => void;
  onOpenCharacterCreator: () => void;
  onBackToConfirmationBook: () => void;
  onPlaySoundEffect: (type: SoundEffectType) => void;
}

const HALL_POSITION_STORAGE_KEY = 'musical_tavern_hall_pos_v3';

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface FootstepPuff {
  x: number;
  y: number;
  bornSec: number;
}

/**
 * 3rd-Person 2D Pixel Art RPG Tavern Hall with 3/4 Perspective, Smooth Following Camera,
 * Y-Sorted Depth Rendering, Wall/Furniture Collisions, 8-Directional Free Movement
 * (WASD/Arrows + Virtual Joystick), Click-to-Move A* Pathfinding, Living NPCs,
 * Environmental Animations, and 9 Interactive Tavern Points.
 */
export const TavernHallScene: React.FC<TavernHallSceneProps> = ({
  traveler,
  appearance,
  mixer,
  onChangeMixer,
  onOpenCharacterCreator,
  onBackToConfirmationBook,
  onPlaySoundEffect,
}) => {
  // Load saved player position from localStorage
  const [playerUiState, setPlayerUiState] = useState<PlayerPhysicsState>(() => {
    try {
      const raw = localStorage.getItem(`${HALL_POSITION_STORAGE_KEY}_${traveler.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number' &&
          parsed.x >= 68 &&
          parsed.x <= WORLD_WIDTH - 68 &&
          parsed.y >= 148 &&
          parsed.y <= WORLD_HEIGHT - 56
        ) {
          return {
            ...INITIAL_PLAYER_STATE,
            x: parsed.x,
            y: parsed.y,
            facing: parsed.facing === 'left' ? 'left' : 'right',
            dir8: parsed.dir8 || 'S',
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_PLAYER_STATE;
  });

  const [overrideAnim, setOverrideAnim] = useState<AdventurerAnimation | null>(null);
  const [nearbyStation, setNearbyStation] = useState<TavernInteractiveStation | null>(null);
  const [activeStationModal, setActiveStationModal] =
    useState<TavernInteractiveStation | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<Waypoint | null>(null);
  const [isSecondaryDrawerOpen, setIsSecondaryDrawerOpen] = useState<boolean>(false);
  const [counterActiveTab, setCounterActiveTab] = useState<'atendimento' | 'perfil' | 'audio'>(
    'atendimento'
  );
  const [collectibleFilter, setCollectibleFilter] = useState<'artista' | 'banda' | 'raridade'>(
    'raridade'
  );
  const [selectedBookArtistId, setSelectedBookArtistId] = useState<string | null>(null);
  const [progression, setProgression] = useState<PlayerProgressionState>(() =>
    loadPlayerProgression(traveler.id)
  );
  const [activeQuizConfig, setActiveQuizConfig] = useState<{
    mode: 'solo' | 'multiplayer';
    tableName: string;
  } | null>(null);
  const [statusLog, setStatusLog] = useState<string>(
    `${appearance.adventurerName} explora o Salão Principal! Clique em qualquer objeto ou piso, ou use WASD/Joystick.`
  );

  // Refs for real-time 2D world simulation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<PlayerPhysicsState>(playerUiState);
  const cameraRef = useRef<{ camX: number; camY: number }>({
    camX: Math.max(0, Math.min(WORLD_WIDTH - 960, playerUiState.x - 480)),
    camY: Math.max(0, Math.min(WORLD_HEIGHT - 480, playerUiState.y - 290)),
  });
  const pathRef = useRef<Waypoint[]>([]);
  const pendingStationRef = useRef<TavernInteractiveStation | null>(null);
  const pendingStoolRef = useRef<TavernSeatStool | null>(null);
  const keysHeldRef = useRef<Set<string>>(new Set());
  const joystickVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const overrideAnimRef = useRef<AdventurerAnimation | null>(overrideAnim);
  const appearanceRef = useRef<AdventurerAppearance>(appearance);
  const nearbyIdRef = useRef<string | null>(null);
  const greetedNpcIdsRef = useRef<Set<string>>(new Set());
  const footstepPuffsRef = useRef<FootstepPuff[]>([]);
  const lastPuffSecRef = useRef<number>(0);

  // Pooled golden dust motes in the 2D tavern world (optimized fixed pool for Android/Desktop)
  const dustParticlesRef = useRef<DustParticle[]>(
    Array.from({ length: 22 }, (_, i) => ({
      x: 80 + ((i * 97) % (WORLD_WIDTH - 160)),
      y: 135 + ((i * 61) % (WORLD_HEIGHT - 190)),
      vx: (i % 2 === 0 ? 1 : -1) * (3 + (i % 4) * 1.5),
      vy: -2 - (i % 3) * 1.2,
      size: i % 3 === 0 ? 3 : 2,
      alpha: 0.25 + (i % 4) * 0.12,
      phase: i * 0.7,
    }))
  );

  useEffect(() => {
    overrideAnimRef.current = overrideAnim;
  }, [overrideAnim]);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  // Persist player coordinates periodically
  useEffect(() => {
    const saveTimer = window.setInterval(() => {
      try {
        const cur = playerRef.current;
        localStorage.setItem(
          `${HALL_POSITION_STORAGE_KEY}_${traveler.id}`,
          JSON.stringify({
            x: Math.round(cur.x),
            y: Math.round(cur.y),
            facing: cur.facing,
            dir8: cur.dir8,
          })
        );
      } catch {
        // ignore
      }
    }, 1500);
    return () => window.clearInterval(saveTimer);
  }, [traveler.id]);

  // Execute a station interaction upon arrival or when pressing E / clicking the prompt
  const executeStationInteraction = useCallback(
    (station: TavernInteractiveStation) => {
      if (station.id === 'counter_barnaby') {
        onPlaySoundEffect('mug');
      } else if (station.id === 'musical_stage') {
        onPlaySoundEffect('fanfare');
      } else if (
        station.id === 'collectible_book' ||
        station.id === 'artist_shelf' ||
        station.id === 'notice_board'
      ) {
        onPlaySoundEffect('flip');
      } else {
        onPlaySoundEffect('interact');
      }

      playerRef.current = {
        ...playerRef.current,
        vx: 0,
        vy: 0,
        isMoving: false,
        facing: station.facingOnInteract,
        vertical: 'front',
      };
      setPlayerUiState(playerRef.current);
      setOverrideAnim(station.interactionAnimation);
      setActiveStationModal(station);
      setStatusLog(`${station.title}: ${station.dialogueLines[0]}`);
    },
    [onPlaySoundEffect]
  );

  // Command the adventurer to walk via A* pathfinding to a station and interact
  const navigateToStationAndInteract = useCallback(
    (station: TavernInteractiveStation) => {
      const cur = playerRef.current;
      const dist = Math.hypot(cur.x - station.interactX, cur.y - station.interactY);
      pendingStoolRef.current = null;
      if (dist <= 36) {
        pathRef.current = [];
        setDestinationMarker(null);
        pendingStationRef.current = null;
        executeStationInteraction(station);
        return;
      }

      onPlaySoundEffect('interact');
      const waypoints = findPathAStar(
        cur.x,
        cur.y,
        station.interactX,
        station.interactY,
        TAVERN_OBSTACLES
      );
      pathRef.current = waypoints;
      pendingStationRef.current = station;
      setOverrideAnim(null);
      setActiveStationModal(null);
      setDestinationMarker({ x: station.interactX, y: station.interactY });
      setStatusLog(`Caminhando até ${station.title}...`);
    },
    [executeStationInteraction, onPlaySoundEffect]
  );

  // Command the adventurer to walk to a specific table stool and sit down
  const navigateToStoolAndSit = useCallback(
    (stool: TavernSeatStool) => {
      const cur = playerRef.current;
      const dist = Math.hypot(cur.x - stool.x, cur.y - stool.y);
      pendingStationRef.current = null;
      if (dist <= 24) {
        pathRef.current = [];
        setDestinationMarker(null);
        playerRef.current = {
          ...cur,
          x: stool.x,
          y: stool.y,
          vx: 0,
          vy: 0,
          isMoving: false,
          facing: stool.facing,
          vertical: 'front',
        };
        setPlayerUiState(playerRef.current);
        setOverrideAnim('sit');
        setActiveStationModal(null);
        onPlaySoundEffect('mug');
        setStatusLog(
          `${appearance.adventurerName} sentou-se na ${stool.label} (${stool.tableName}).`
        );
        return;
      }

      onPlaySoundEffect('interact');
      const waypoints = findPathAStar(cur.x, cur.y, stool.x, stool.y, TAVERN_OBSTACLES);
      pathRef.current = waypoints;
      pendingStoolRef.current = stool;
      setOverrideAnim(null);
      setActiveStationModal(null);
      setDestinationMarker({ x: stool.x, y: stool.y });
      setStatusLog(`Caminhando até ${stool.label}...`);
    },
    [appearance.adventurerName, onPlaySoundEffect]
  );

  // Keyboard listener for WASD / Arrows + 'E' to interact + Escape to cancel path/modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const k = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          k
        )
      ) {
        e.preventDefault();
        keysHeldRef.current.add(k);
        if (pathRef.current.length > 0) {
          pathRef.current = [];
          pendingStationRef.current = null;
          pendingStoolRef.current = null;
          setDestinationMarker(null);
        }
        setOverrideAnim(null);
      } else if (k === 'e' || k === 'enter') {
        const nearest = findNearestInteractable(
          playerRef.current.x,
          playerRef.current.y,
          TAVERN_INTERACTIVE_STATIONS
        );
        if (nearest && nearest.inRange) {
          e.preventDefault();
          navigateToStationAndInteract(nearest.station);
        }
      } else if (k === 'escape') {
        pathRef.current = [];
        pendingStationRef.current = null;
        pendingStoolRef.current = null;
        setDestinationMarker(null);
        setActiveStationModal(null);
        setIsSecondaryDrawerOpen(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      keysHeldRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [navigateToStationAndInteract]);

  // Handle clicking/tapping directly on the 2D RPG World Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const worldX = Math.round(cameraRef.current.camX + canvasX);
    const worldY = Math.round(cameraRef.current.camY + canvasY);

    // 1. Check if clicked directly on a Seat Stool
    for (const stool of TAVERN_SEAT_STOOLS) {
      if (Math.hypot(worldX - stool.x, worldY - stool.y) <= 22) {
        navigateToStoolAndSit(stool);
        return;
      }
    }

    // 2. Check if clicked directly on or near one of the 9 interactive stations
    for (const st of TAVERN_INTERACTIVE_STATIONS) {
      const distToObj = Math.hypot(worldX - st.objectX, worldY - st.objectY);
      const distToInteract = Math.hypot(worldX - st.interactX, worldY - st.interactY);
      if (distToObj <= 56 || distToInteract <= 40) {
        navigateToStationAndInteract(st);
        return;
      }
    }

    // 3. Check if clicked directly on an NPC (using live position for strolling NPCs)
    const nowSec = performance.now() / 1000;
    for (const npc of TAVERN_NPCS) {
      const npcRuntime = getNpcRuntimeState(
        npc,
        nowSec,
        playerRef.current.x,
        playerRef.current.y
      );
      if (Math.hypot(worldX - npcRuntime.x, worldY - npcRuntime.y) <= 38) {
        onPlaySoundEffect('npc');
        setStatusLog(`${npc.name} (${npc.title}): ${npc.greetingLine}`);
        const walkTargetY = Math.min(WORLD_HEIGHT - 56, npcRuntime.y + 42);
        const waypoints = findPathAStar(
          playerRef.current.x,
          playerRef.current.y,
          npcRuntime.x,
          walkTargetY,
          TAVERN_OBSTACLES
        );
        if (waypoints.length > 0) {
          pathRef.current = waypoints;
          pendingStationRef.current = null;
          pendingStoolRef.current = null;
          setActiveStationModal(null);
          setDestinationMarker(waypoints[waypoints.length - 1]);
        }
        return;
      }
    }

    // 4. Otherwise, compute A* path to the clicked floor location
    onPlaySoundEffect('quill');
    const cur = playerRef.current;
    const waypoints = findPathAStar(cur.x, cur.y, worldX, worldY, TAVERN_OBSTACLES);
    if (waypoints.length > 0) {
      pathRef.current = waypoints;
      pendingStationRef.current = null;
      pendingStoolRef.current = null;
      if (overrideAnimRef.current === 'sit') {
        setOverrideAnim('stand_up');
        window.setTimeout(() => {
          if (overrideAnimRef.current === 'stand_up') setOverrideAnim(null);
        }, 420);
      } else {
        setOverrideAnim(null);
      }
      setActiveStationModal(null);
      const finalWp = waypoints[waypoints.length - 1];
      setDestinationMarker(finalWp);
      setStatusLog(
        `Caminhando pelo salão até (${Math.round(finalWp.x)}, ${Math.round(finalWp.y)}).`
      );
    }
  };

  // Musical reaction helper
  const triggerMusicalReaction = (harmonic: boolean, customMsg?: string) => {
    if (harmonic) {
      onPlaySoundEffect('fanfare');
      setOverrideAnim('dance');
      setStatusLog(
        customMsg ||
          `${appearance.adventurerName} acompanha a melodia medieval dançando no ritmo do alaúde!`
      );
    } else {
      onPlaySoundEffect('quill');
      setOverrideAnim('negative');
      setStatusLog(
        customMsg ||
          `Uma corda desafinou! ${appearance.adventurerName} reage negativamente ao acorde dissonante.`
      );
    }
  };

  // ============================================================================
  // MAIN 2D RPG WORLD SIMULATION & STARDEW-INSPIRED 3/4 PIXEL-ART RENDERING LOOP
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // Pre-bake the rich Stardew Valley-style static architectural & floor tilemap once
    const staticWorldCanvas = document.createElement('canvas');
    staticWorldCanvas.width = WORLD_WIDTH;
    staticWorldCanvas.height = WORLD_HEIGHT;
    const sCtx = staticWorldCanvas.getContext('2d');
    if (sCtx) {
      sCtx.imageSmoothingEnabled = false;
      buildStardewTavernStaticTilemap(sCtx);
    }

    let animId = 0;
    let timerId = 0;
    let disposed = false;
    let lastTime = performance.now();
    const startTime = lastTime;

    const tickAndDraw = (now: number) => {
      if (disposed) return;

      const dt = Math.min(0.09, Math.max(0.016, (now - lastTime) / 1000));
      lastTime = now;
      const elapsedSec = (now - startTime) / 1000;

      // 1. Gather free movement input from WASD/Arrows + Virtual Joystick
      const held = keysHeldRef.current;
      let keyX = 0;
      let keyY = 0;
      if (held.has('a') || held.has('arrowleft')) keyX -= 1;
      if (held.has('d') || held.has('arrowright')) keyX += 1;
      if (held.has('w') || held.has('arrowup')) keyY -= 1;
      if (held.has('s') || held.has('arrowdown')) keyY += 1;

      const joy = joystickVecRef.current;
      const inputX = Math.abs(joy.x) > 0.05 ? joy.x : keyX;
      const inputY = Math.abs(joy.y) > 0.05 ? joy.y : keyY;
      const hasDirectInput = Math.hypot(inputX, inputY) > 0.05;

      // 2. Step Physics (Free movement OR A* Pathfollowing)
      const prevPlayer = playerRef.current;
      let nextPlayer = prevPlayer;
      if (hasDirectInput) {
        if (pathRef.current.length > 0) {
          pathRef.current = [];
          pendingStationRef.current = null;
          pendingStoolRef.current = null;
          setDestinationMarker(null);
        }
        nextPlayer = stepFreeMovementPhysics(
          nextPlayer,
          inputX,
          inputY,
          TAVERN_OBSTACLES,
          dt
        );
      } else if (pathRef.current.length > 0) {
        const res = stepPathFollowing(
          nextPlayer,
          pathRef.current,
          TAVERN_OBSTACLES,
          dt
        );
        nextPlayer = res.nextState;
        pathRef.current = res.remainingPath;

        if (res.arrived) {
          setDestinationMarker(null);
          const pendingSt = pendingStationRef.current;
          const pendingStool = pendingStoolRef.current;
          if (pendingSt) {
            pendingStationRef.current = null;
            executeStationInteraction(pendingSt);
          } else if (pendingStool) {
            pendingStoolRef.current = null;
            playerRef.current = {
              ...nextPlayer,
              x: pendingStool.x,
              y: pendingStool.y,
              vx: 0,
              vy: 0,
              isMoving: false,
              facing: pendingStool.facing,
              vertical: 'front',
            };
            nextPlayer = playerRef.current;
            setPlayerUiState(nextPlayer);
            setOverrideAnim('sit');
            onPlaySoundEffect('mug');
            setStatusLog(
              `${appearanceRef.current.adventurerName} sentou-se na ${pendingStool.label} (${pendingStool.tableName}).`
            );
          }
        }
      } else {
        nextPlayer = stepFreeMovementPhysics(nextPlayer, 0, 0, TAVERN_OBSTACLES, dt);
      }

      playerRef.current = nextPlayer;

      // Footstep audio + subtle floor dust puff when moving
      if (nextPlayer.isMoving) {
        onPlaySoundEffect('footstep');
        if (elapsedSec - lastPuffSecRef.current > 0.24) {
          lastPuffSecRef.current = elapsedSec;
          footstepPuffsRef.current.push({
            x: nextPlayer.x + (Math.random() * 8 - 4),
            y: nextPlayer.y + 2,
            bornSec: elapsedSec,
          });
          if (footstepPuffsRef.current.length > 8) {
            footstepPuffsRef.current.shift();
          }
        }
      }

      // Only trigger React state sync when movement state starts/stops (keeps DOM stable during walking)
      if (nextPlayer.isMoving !== prevPlayer.isMoving) {
        setPlayerUiState(nextPlayer);
      }

      // 3. Check Proximity to Interactive Stations
      const nearest = findNearestInteractable(
        nextPlayer.x,
        nextPlayer.y,
        TAVERN_INTERACTIVE_STATIONS
      );
      const nextNearbyStation = nearest && nearest.inRange ? nearest.station : null;
      const nextNearbyId = nextNearbyStation ? nextNearbyStation.id : null;
      if (nextNearbyId !== nearbyIdRef.current) {
        nearbyIdRef.current = nextNearbyId;
        setNearbyStation(nextNearbyStation);
      }

      // 4. Compute NPC runtime states (including strolling NPC patrol position) & greeting chime
      const npcStates: NpcRuntimeState[] = TAVERN_NPCS.map((npc) => {
        const st = getNpcRuntimeState(npc, elapsedSec, nextPlayer.x, nextPlayer.y);
        if (st.isPlayerNear && !greetedNpcIdsRef.current.has(npc.id)) {
          greetedNpcIdsRef.current.add(npc.id);
          onPlaySoundEffect('npc');
        } else if (!st.isPlayerNear && greetedNpcIdsRef.current.has(npc.id)) {
          greetedNpcIdsRef.current.delete(npc.id);
        }
        return st;
      });

      // 5. Smoothly interpolate 3rd-person camera toward player
      const viewW = canvas.width;
      const viewH = canvas.height;
      cameraRef.current = stepCameraLerp(
        cameraRef.current.camX,
        cameraRef.current.camY,
        nextPlayer.x,
        nextPlayer.y,
        viewW,
        viewH,
        dt,
        9.0
      );

      const camX = Math.round(cameraRef.current.camX);
      const camY = Math.round(cameraRef.current.camY);

      // Expose state for automated testing & inspection
      (window as unknown as Record<string, unknown>).__TAVERN_HALL_DEBUG__ = {
        player: playerRef.current,
        camera: cameraRef.current,
        activePathLength: pathRef.current.length,
        nearbyStationId: nextNearbyId,
        npcCount: npcStates.length,
        walkingNpcs: npcStates.filter((n) => n.isWalking).map((n) => n.npc.id),
      };

      // ========================================================================
      // 6. RENDER STARDEW VALLEY-INSPIRED 3/4 PERSPECTIVE PIXEL ART WORLD
      // ========================================================================
      ctx.clearRect(0, 0, viewW, viewH);
      ctx.save();
      ctx.translate(-camX, -camY);

      // --- A. BLIT PRE-BAKED STARDEW SALOON ARCHITECTURAL TILEMAP ---
      ctx.drawImage(staticWorldCanvas, 0, 0);

      // --- B. ANIMATED RAIN STREAKS IN WINDOWS & FLICKERING WALL SCONCES ---
      const windowPositions = [776, 984];
      for (const winX of windowPositions) {
        ctx.fillStyle = 'rgba(175, 215, 255, 0.52)';
        for (let r = 0; r < 6; r++) {
          const rx = winX + 6 + ((r * 11 + Math.floor(elapsedSec * 28)) % 50);
          const ry = 26 + ((r * 15 + Math.floor(elapsedSec * 82)) % 52);
          ctx.fillRect(rx, ry, 2, 7);
        }
        // Window muntin crossbars over rain
        ctx.fillStyle = '#241209';
        ctx.fillRect(winX + 30, 24, 4, 66);
        ctx.fillRect(winX, 56, 64, 4);
      }

      const sconceXList = [80, 280, 496, 748, 948];
      for (let i = 0; i < sconceXList.length; i++) {
        const sx = sconceXList[i];
        const sy = 50;
        const scFlicker = Math.sin(elapsedSec * 6.5 + i * 1.4) * 2;
        const sconceGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 52 + scFlicker);
        sconceGrad.addColorStop(0, 'rgba(255, 205, 95, 0.36)');
        sconceGrad.addColorStop(1, 'rgba(255, 150, 40, 0)');
        ctx.fillStyle = sconceGrad;
        ctx.fillRect(sx - 52, sy - 52, 104, 104);

        // Animated pixel flame tip
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(sx - 2, sy - 9 + ((Math.floor(elapsedSec * 8) + i) % 2), 4, 5);
        ctx.fillStyle = '#fff59d';
        ctx.fillRect(sx - 1, sy - 7 + ((Math.floor(elapsedSec * 8) + i) % 2), 2, 3);
      }

      // --- C. WARM AMBIENT FLOOR POOLS (Firelight, Stage & Chandeliers) ---
      const flicker = Math.sin(elapsedSec * 7) * 0.03 + 0.19;
      const fireGrad = ctx.createRadialGradient(384, 182, 12, 384, 182, 230);
      fireGrad.addColorStop(0, `rgba(255, 175, 60, ${flicker + 0.14})`);
      fireGrad.addColorStop(0.6, `rgba(235, 130, 35, ${flicker * 0.45})`);
      fireGrad.addColorStop(1, 'rgba(255, 140, 35, 0)');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(150, 40, 460, 350);

      const stageGrad = ctx.createRadialGradient(968, 204, 14, 968, 204, 185);
      stageGrad.addColorStop(0, 'rgba(255, 220, 125, 0.22)');
      stageGrad.addColorStop(1, 'rgba(247, 216, 124, 0)');
      ctx.fillStyle = stageGrad;
      ctx.fillRect(780, 70, 360, 280);

      // --- D. FOOTSTEP DUST PUFFS & PATHFINDING BREADCRUMBS ---
      footstepPuffsRef.current = footstepPuffsRef.current.filter(
        (p) => elapsedSec - p.bornSec < 0.55
      );
      for (const puff of footstepPuffsRef.current) {
        const age = elapsedSec - puff.bornSec;
        const alpha = Math.max(0, 0.48 * (1 - age / 0.55));
        const sz = 4 + Math.floor(age * 8);
        ctx.fillStyle = `rgba(238, 215, 185, ${alpha.toFixed(2)})`;
        ctx.fillRect(Math.round(puff.x - sz / 2), Math.round(puff.y - sz / 2), sz, sz);
      }

      if (pathRef.current.length > 0) {
        for (let i = 0; i < pathRef.current.length; i++) {
          const wp = pathRef.current[i];
          const isLast = i === pathRef.current.length - 1;
          if (isLast) {
            const pulse = 10 + Math.sin(elapsedSec * 8) * 3;
            ctx.strokeStyle = '#f7d87c';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#d9a738';
            ctx.fillRect(wp.x - 3, wp.y - 3, 6, 6);
          } else {
            ctx.fillStyle = 'rgba(247, 216, 124, 0.65)';
            ctx.fillRect(wp.x - 2, wp.y - 2, 4, 4);
          }
        }
      }

      // --- E. Y-SORTED 3/4 PERSPECTIVE OBJECTS, LIVING NPCS & PLAYER ---
      type RenderItem = {
        depthY: number;
        draw: () => void;
      };

      const renderItems: RenderItem[] = [];

      // 1) Add All 7 Living Tavern NPCs (Barnaby, Lirael, Garrick, Mirela, Thom, Freya, and strolling Elena)
      for (const npcState of npcStates) {
        renderItems.push({
          depthY: npcState.depthY,
          draw: () => {
            drawTavernNpcPixelSprite(ctx, npcState, elapsedSec);
          },
        });
      }

      // 2) Add all 3/4 Furniture & Architectural Obstacles
      for (const obs of TAVERN_OBSTACLES) {
        if (obs.kind === 'wall') continue;

        renderItems.push({
          depthY: obs.depthY,
          draw: () => {
            drawObstacle3Quarter(ctx, obs, elapsedSec);
          },
        });
      }

      // 3) Add Player's Custom 16-Bit Adventurer at depthY = nextPlayer.y
      renderItems.push({
        depthY: nextPlayer.y,
        draw: () => {
          const activeAnim: AdventurerAnimation = nextPlayer.isMoving
            ? 'walk'
            : overrideAnimRef.current || 'idle';

          // Warm elliptical floor shadow beneath adventurer's boots
          ctx.fillStyle = 'rgba(14, 7, 3, 0.52)';
          ctx.fillRect(Math.round(nextPlayer.x - 20), Math.round(nextPlayer.y - 6), 40, 10);

          // Sprite is 48x56, scaled 2x -> 96x112 world pixels, feet anchored at (nextPlayer.x, nextPlayer.y)
          ctx.save();
          ctx.translate(Math.round(nextPlayer.x - 48), Math.round(nextPlayer.y - 102));
          ctx.scale(2, 2);
          drawPixelAdventurerSprite(ctx, {
            appearance: appearanceRef.current,
            animation: activeAnim,
            facing: nextPlayer.facing,
            vertical: nextPlayer.vertical,
            timeSec: elapsedSec,
          });
          ctx.restore();

          // Player Nameplate above head
          const nameText = appearanceRef.current.adventurerName || 'Aventureiro';
          ctx.font = 'bold 11px Cinzel, serif';
          const textW = ctx.measureText(nameText).width;
          const badgeW = textW + 14;
          const badgeX = Math.round(nextPlayer.x - badgeW / 2);
          const badgeY = Math.round(nextPlayer.y - 118);

          ctx.fillStyle = 'rgba(24, 12, 6, 0.92)';
          ctx.fillRect(badgeX, badgeY, badgeW, 18);
          ctx.strokeStyle = '#d9a738';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(badgeX, badgeY, badgeW, 18);

          ctx.fillStyle = '#f7d87c';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nameText, Math.round(nextPlayer.x), badgeY + 9);
        },
      });

      const sorted = sortRenderablesByDepth(renderItems);
      for (const item of sorted) {
        item.draw();
      }

      // --- F. OVERHEAD WROUGHT-IRON CHANDELIER LIGHT HALOS & FLOATING DUST MOTES ---
      const chandelierCoords = [
        { x: 282, y: 364 },
        { x: 576, y: 376 },
        { x: 878, y: 368 },
      ];
      for (let cIdx = 0; cIdx < chandelierCoords.length; cIdx++) {
        const ch = chandelierCoords[cIdx];
        const chGlow = ctx.createRadialGradient(ch.x, ch.y, 6, ch.x, ch.y, 115);
        chGlow.addColorStop(0, 'rgba(255, 215, 115, 0.14)');
        chGlow.addColorStop(1, 'rgba(255, 180, 70, 0)');
        ctx.fillStyle = chGlow;
        ctx.fillRect(ch.x - 115, ch.y - 115, 230, 230);
      }

      for (const p of dustParticlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < 130) p.y = WORLD_HEIGHT - 55;
        if (p.x < 55) p.x = WORLD_WIDTH - 60;
        if (p.x > WORLD_WIDTH - 55) p.x = 60;

        const twinkle = p.alpha + Math.sin(elapsedSec * 3 + p.phase) * 0.12;
        ctx.fillStyle = `rgba(255, 228, 145, ${Math.max(0.1, twinkle).toFixed(2)})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }

      // --- G. DISCREET PROXIMITY INTERACTION INDICATOR (Only for the station in range) ---
      if (nearest && nearest.inRange) {
        const st = nearest.station;
        const bobY = Math.sin(elapsedSec * 5) * 2;
        const rawY = st.objectY - 42;
        const playerNameplateY = nextPlayer.y - 118;
        const safeY =
          Math.abs(rawY - playerNameplateY) < 24 && Math.abs(st.objectX - nextPlayer.x) < 90
            ? playerNameplateY - 24
            : rawY;
        const labelY = Math.max(14, safeY + bobY);

        const text = `[E] ${st.shortPrompt}`;
        ctx.font = 'bold 10.5px Cinzel, serif';
        const tw = ctx.measureText(text).width + 14;
        const lx = Math.round(st.objectX - tw / 2);
        const ly = Math.round(labelY);

        ctx.fillStyle = 'rgba(107, 29, 47, 0.95)';
        ctx.fillRect(lx, ly, tw, 19);
        ctx.strokeStyle = '#f7d87c';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(lx, ly, tw, 19);

        ctx.fillStyle = '#faf5e8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, Math.round(st.objectX), ly + 9.5);
      }

      ctx.restore();

      timerId = window.setTimeout(() => {
        if (!disposed) animId = requestAnimationFrame(tickAndDraw);
      }, 60);
    };

    animId = requestAnimationFrame(tickAndDraw);
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
    };
  }, [executeStationInteraction, onPlaySoundEffect]);

  const updateCounterAudioChannel = (
    channel: 'masterVolume' | 'music' | 'sfx' | 'ambience',
    val: number
  ) => {
    if (!mixer || !onChangeMixer) return;
    const clamped = clampVolume(val);
    onChangeMixer({
      ...mixer,
      masterMuted: false,
      [channel]: clamped,
      ...(channel === 'sfx' ? { pages: clamped } : {}),
    });
  };

  return (
    <div
      data-testid="tavern-hall-scene"
      className="relative mx-auto w-full max-w-[1160px] flex flex-col gap-1"
    >
      {/* 1. COMPACT DIEGETIC TOP STATUS BAR (Does not cover the tavern scene) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-t-xl border-2 border-[#9e7b1c]/80 bg-[#180d07]/95 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-[#f7d87c] shrink-0" />
          <p className="text-xs text-[#f4ebd9] truncate">
            <span className="font-display font-bold text-[#f7d87c] mr-1.5">
              Crônica do Salão:
            </span>
            <span className="italic">{statusLog}</span>
          </p>
        </div>

        {/* Contextual Proximity Action Pill when near any Interactive Point */}
        <div className="flex items-center gap-1.5 shrink-0">
          {nearbyStation && (
            <button
              type="button"
              data-testid="proximity-interact-btn"
              onClick={() => navigateToStationAndInteract(nearbyStation)}
              className="px-2.5 py-0.5 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[11px] font-display font-bold text-[#faf5e8] shadow cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#f7d87c]" />
              <span>[E] Interagir: {nearbyStation.shortPrompt}</span>
            </button>
          )}

          {destinationMarker && (
            <button
              type="button"
              onClick={() => {
                pathRef.current = [];
                pendingStationRef.current = null;
                pendingStoolRef.current = null;
                setDestinationMarker(null);
                setStatusLog('Deslocamento cancelado pelo aventureiro.');
              }}
              className="px-2 py-0.5 rounded border border-[#9e7b1c]/70 bg-[#2b170e] hover:border-[#f7d87c] text-[10px] font-display text-[#eadbc8] cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3 text-[#e8833a]" />
              <span>Cancelar Destino</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PROTAGONIST 3/4 PERSPECTIVE 2D PIXEL ART TAVERN WORLD VIEWPORT */}
      <div className="relative w-full h-[450px] sm:h-[515px] border-2 border-[#9e7b1c]/80 bg-[#140a06] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.92)]">
        <canvas
          ref={canvasRef}
          width={960}
          height={480}
          data-testid="tavern-world-canvas"
          onClick={handleCanvasClick}
          className="pixel-canvas w-full h-full object-cover cursor-crosshair"
        />

        {/* Bottom-Left On-Screen Virtual Joystick (Always Accessible for Mobile & Hybrid Control) */}
        <div className="absolute bottom-3 left-3 z-20">
          <VirtualJoystick
            onChangeVector={(vx, vy) => {
              joystickVecRef.current = { x: vx, y: vy };
              if (Math.hypot(vx, vy) > 0.05) {
                setOverrideAnim(null);
              }
            }}
          />
        </div>

        {/* SECONDARY ANIMATIONS & GESTURES FLOATING PANEL (Opened via Discreet Button) */}
        {isSecondaryDrawerOpen && (
          <div
            data-testid="secondary-animations-panel"
            role="region"
            aria-label="Painel Secundário de Animações e Gestos"
            className="absolute bottom-3 right-3 left-28 sm:left-auto sm:w-[460px] z-25 rounded-lg border-2 border-[#d9a738] bg-[#1b0e08]/96 p-2.5 text-[#f4ebd9] shadow-[0_14px_34px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-center justify-between border-b border-[#9e7b1c]/45 pb-1.5 mb-2">
              <span className="font-display text-[11px] font-bold tracking-wider text-[#f7d87c]">
                Grimório de Gestos, Posturas & Banquetas
              </span>
              <button
                type="button"
                onClick={() => setIsSecondaryDrawerOpen(false)}
                className="p-0.5 rounded border border-[#9e7b1c]/60 bg-[#2b170e] text-[#f4ebd9] hover:border-[#f7d87c] cursor-pointer"
                aria-label="Fechar Painel de Gestos"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 7 Character Animations */}
            <div className="mb-2">
              <span className="block font-display text-[10px] uppercase tracking-wider text-[#dfc9ad]/80 mb-1">
                Animações do Aventureiro:
              </span>
              <div className="flex flex-wrap gap-1">
                {ANIMATION_META.map((item) => {
                  const currentAnim = playerUiState.isMoving
                    ? 'walk'
                    : overrideAnim || 'idle';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`anim-btn-${item.id}`}
                      onClick={() => {
                        onPlaySoundEffect('quill');
                        pathRef.current = [];
                        pendingStationRef.current = null;
                        pendingStoolRef.current = null;
                        setDestinationMarker(null);
                        setOverrideAnim(item.id);
                      }}
                      className={`px-2 py-1 rounded border text-[10px] font-display font-bold cursor-pointer transition-colors ${
                        currentAnim === item.id
                          ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                          : 'border-[#9e7b1c]/50 bg-[#2b170e] text-[#eadbc8] hover:border-[#d9a738]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Sit on Stools + Harmonic Rhythm */}
            <div className="pt-1.5 border-t border-[#9e7b1c]/35 flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-display text-[10px] font-bold text-[#d9a738] mr-1">
                  Sentar:
                </span>
                {TAVERN_SEAT_STOOLS.map((stool, idx) => (
                  <button
                    key={stool.id}
                    type="button"
                    data-testid={`sit-stool-btn-${stool.id}`}
                    onClick={() => navigateToStoolAndSit(stool)}
                    className="px-2 py-0.5 rounded border border-[#9e7b1c]/60 bg-[#28150c] hover:border-[#f7d87c] text-[10px] font-display text-[#f4ebd9] cursor-pointer"
                  >
                    Mesa #{idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => triggerMusicalReaction(true)}
                className="px-2.5 py-1 rounded border border-[#d9a738] bg-[#362013] hover:bg-[#4e342e] text-[10px] font-display font-bold text-[#f7d87c] cursor-pointer flex items-center gap-1"
              >
                <Music className="w-3 h-3" />
                <span>Ritmo Harmônico</span>
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE STATION DIALOG / ACTIVITY OVERLAY */}
        {activeStationModal &&
          (activeStationModal.id === 'notice_board' ? (
            <MuralDeAvisos
              adventurerName={appearance.adventurerName}
              onClose={() => setActiveStationModal(null)}
              onPlaySoundEffect={onPlaySoundEffect}
              onStatusUpdate={(msg) => setStatusLog(msg)}
            />
          ) : (
            <div
              data-testid="station-interaction-modal"
              role="dialog"
              aria-label={activeStationModal.title}
              className="absolute top-3 right-3 left-3 sm:left-auto sm:w-[460px] max-h-[420px] overflow-y-auto z-30 rounded-lg border-2 border-[#f7d87c] bg-[#1e1009]/96 text-[#f4ebd9] p-3.5 shadow-[0_16px_44px_rgba(0,0,0,0.96)]"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#9e7b1c]/50 pb-2 mb-2.5">
                <div>
                  <span className="block font-display text-[10px] uppercase tracking-widest text-[#d9a738]">
                    Ponto de Interação da Taverna
                  </span>
                  <h2 className="font-display text-sm sm:text-base font-extrabold text-[#f7d87c]">
                    {activeStationModal.title}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Fechar Interação"
                  onClick={() => setActiveStationModal(null)}
                  className="p-1 rounded border border-[#9e7b1c]/60 bg-[#2b170e] hover:border-[#f7d87c] text-[#f4ebd9] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-[#eadbc8] mb-2.5">
                {activeStationModal.dialogueLines.map((line, idx) => (
                  <p key={idx} className="italic leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>

              {/* 1. BALCÃO & BARNABY: PERFIL DO JOGADOR, CONFIGURAÇÕES E ATENDIMENTO */}
              {activeStationModal.id === 'counter_barnaby' && (
                <div className="pt-2 border-t border-[#9e7b1c]/40 space-y-2.5">
                  <div className="flex gap-1 border-b border-[#9e7b1c]/35 pb-1.5">
                    {(
                      [
                        { id: 'atendimento', label: 'Atendimento' },
                        { id: 'perfil', label: 'Perfil do Jogador' },
                        { id: 'audio', label: 'Configurações de Áudio' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onPlaySoundEffect('quill');
                          setCounterActiveTab(tab.id);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-display font-bold cursor-pointer border ${
                          counterActiveTab === tab.id
                            ? 'bg-[#6b1d2f] text-[#faf5e8] border-[#f7d87c]'
                            : 'bg-[#28150c] text-[#dfc9ad] border-[#9e7b1c]/40'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {counterActiveTab === 'atendimento' && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#dfc9ad]">
                        Barnaby está polindo as canecas de carvalho atrás do balcão e cumprimenta você com um sorriso acolhedor.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onPlaySoundEffect('mug');
                            setOverrideAnim('celebrate');
                            setStatusLog(
                              `Barnaby serviu uma caneca de Hidromel das Seis Cordas para ${appearance.adventurerName}!`
                            );
                          }}
                          className="px-3 py-1.5 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-bold text-[#faf5e8] cursor-pointer"
                        >
                          Brindar com Barnaby
                        </button>
                        <button
                          type="button"
                          onClick={onOpenCharacterCreator}
                          className="px-3 py-1.5 rounded border border-[#9e7b1c] bg-[#2b170e] hover:border-[#f7d87c] text-xs font-display font-bold text-[#f7d87c] cursor-pointer"
                        >
                          Personalizar Aventureiro
                        </button>
                      </div>
                    </div>
                  )}

                  {counterActiveTab === 'perfil' && (
                    <div
                      data-testid="counter-player-profile"
                      className="rounded border border-[#9e7b1c]/60 bg-[#28150c] p-2.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-[#9e7b1c]/30 pb-1">
                        <span className="font-display font-bold text-[#f7d87c]">
                          {appearance.adventurerName}
                        </span>
                        <span className="font-mono-num text-[11px] text-[#d9a738]">
                          Registro Nº {traveler.entryNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#eadbc8]">
                        <div>
                          <span className="text-[#dfc9ad]/70 block">Título:</span>
                          <span className="font-semibold">{traveler.title}</span>
                        </div>
                        <div>
                          <span className="text-[#dfc9ad]/70 block">Afinidade Musical:</span>
                          <span className="font-semibold text-[#f7d87c]">
                            {traveler.affinity}
                          </span>
                        </div>
                      </div>

                      {/* Persistent Quiz & Collectible Stats */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#9e7b1c]/30 text-center">
                        <div className="p-1.5 rounded bg-[#1b0e08] border border-[#9e7b1c]/40">
                          <span className="block text-[9px] text-[#dfc9ad]/80">
                            Cartas no Grimório
                          </span>
                          <span
                            data-testid="profile-unlocked-cards"
                            className="font-mono-num text-xs font-bold text-[#f7d87c]"
                          >
                            {progression.unlockedArtistIds.length}/{QUIZ_ARTISTS_DB.length}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-[#1b0e08] border border-[#9e7b1c]/40">
                          <span className="block text-[9px] text-[#dfc9ad]/80">
                            Vitórias no Quiz
                          </span>
                          <span
                            data-testid="profile-quiz-wins"
                            className="font-mono-num text-xs font-bold text-[#7dcea0]"
                          >
                            {progression.stats.matchesWon}/{progression.stats.matchesPlayed}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-[#1b0e08] border border-[#9e7b1c]/40">
                          <span className="block text-[9px] text-[#dfc9ad]/80">
                            Prestígio Musical
                          </span>
                          <span
                            data-testid="profile-total-score"
                            className="font-mono-num text-xs font-bold text-[#d9a738]"
                          >
                            {progression.stats.totalScore} pts
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={onOpenCharacterCreator}
                          className="px-2.5 py-1 rounded border border-[#f7d87c] bg-[#6b1d2f] text-[11px] font-display font-bold text-[#faf5e8] cursor-pointer"
                        >
                          Editar Aparência & Traje
                        </button>
                      </div>
                    </div>
                  )}

                  {counterActiveTab === 'audio' && mixer && onChangeMixer && (
                    <div className="rounded border border-[#9e7b1c]/60 bg-[#28150c] p-2.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-[#f7d87c]">
                          Ajustes de Som da Taverna
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeMixer({ ...mixer, masterMuted: !mixer.masterMuted })
                          }
                          className="px-2 py-0.5 rounded border border-[#d9a738] bg-[#362013] text-[10px] font-display font-bold text-[#faf5e8] cursor-pointer flex items-center gap-1"
                        >
                          {mixer.masterMuted ? (
                            <>
                              <VolumeX className="w-3 h-3 text-[#e8833a]" />
                              <span>Ativar Som</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-[#f7d87c]" />
                              <span>Silenciar</span>
                            </>
                          )}
                        </button>
                      </div>
                      {(
                        [
                          { key: 'masterVolume', label: 'Volume Geral', val: mixer.masterVolume ?? 85 },
                          { key: 'music', label: 'Música Instrumental', val: mixer.music },
                          { key: 'sfx', label: 'Efeitos Sonoros', val: mixer.sfx ?? 80 },
                          { key: 'ambience', label: 'Ambiente (Salão & Lareira)', val: mixer.ambience ?? 75 },
                        ] as const
                      ).map((ch) => (
                        <div key={ch.key} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span>{ch.label}</span>
                            <span className="font-mono-num text-[#d9a738]">
                              {mixer.masterMuted ? 0 : ch.val}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={mixer.masterMuted ? 0 : ch.val}
                            onChange={(e) =>
                              updateCounterAudioChannel(ch.key, Number(e.target.value))
                            }
                            className="w-full accent-[#d9a738] h-1.5 bg-[#180c06] rounded cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. MESAS & BANQUETAS: PARTIDAS MUSICAIS, DESAFIOS E SENTAR NAS CADEIRAS */}
              {activeStationModal.id === 'tables_stools' && (
                <div className="pt-2 border-t border-[#9e7b1c]/40 space-y-2.5">
                  <div className="rounded border border-[#9e7b1c]/50 bg-[#28150c] p-2.5 space-y-2">
                    <div className="font-display text-xs font-bold text-[#f7d87c]">
                      Mesas de Quiz Musical (Solo & Turnos até 8 Jogadores)
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-[#1b0e08] border border-[#8c6722]/50 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-display font-bold text-[#faf5e8] block">
                            Mesa dos Trovadores (Oeste) · Desafio Solo
                          </span>
                          <span className="text-[#dfc9ad]/80">
                            Descubra o artista secreto com até 5 dicas e conquiste sua carta
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid="launch-quiz-solo-btn"
                          onClick={() => {
                            onPlaySoundEffect('interact');
                            setActiveStationModal(null);
                            setActiveQuizConfig({
                              mode: 'solo',
                              tableName: 'Mesa dos Trovadores (Oeste)',
                            });
                          }}
                          className="px-2.5 py-1 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-[10px] font-bold cursor-pointer"
                        >
                          Jogar Solo
                        </button>
                      </div>

                      <div className="p-2 rounded bg-[#1b0e08] border border-[#d9a738]/60 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-display font-bold text-[#faf5e8] block">
                            Mesa Principal das Banquetas · Multiplayer (2 a 8 Jogadores)
                          </span>
                          <span className="text-[#dfc9ad]/80">
                            Mesmo artista secreto para todos · Dicas e tentativas individuais por turno
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid="launch-quiz-multi-btn"
                          onClick={() => {
                            onPlaySoundEffect('interact');
                            setActiveStationModal(null);
                            setActiveQuizConfig({
                              mode: 'multiplayer',
                              tableName: 'Mesa Principal das Banquetas',
                            });
                          }}
                          className="px-2.5 py-1 rounded border border-[#f7d87c] bg-[#362013] hover:bg-[#4e342e] text-[#f7d87c] font-display text-[10px] font-bold cursor-pointer"
                        >
                          Abrir Mesa (Até 8 Jogadores)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block font-display text-[11px] font-bold text-[#d9a738] mb-1">
                      Escolher Banqueta para Sentar-se:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {TAVERN_SEAT_STOOLS.map((stool) => (
                        <button
                          key={stool.id}
                          type="button"
                          onClick={() => navigateToStoolAndSit(stool)}
                          className="px-2.5 py-1 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[11px] font-display font-bold text-[#faf5e8] cursor-pointer"
                        >
                          Sentar: {stool.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PALCO MUSICAL: EVENTOS, DESAFIOS E DUETO COM LIRAEL */}
              {activeStationModal.id === 'musical_stage' && (
                <div className="pt-2 border-t border-[#9e7b1c]/40 space-y-2.5">
                  <div className="rounded border border-[#9e7b1c]/50 bg-[#28150c] p-2 text-[11px] text-[#eadbc8]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-[#f7d87c]">
                        Programação do Palco · Com Bardo Lirael
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#6b1d2f] text-[#faf5e8] font-display text-[9px] font-bold">
                        Ao Vivo no Salão
                      </span>
                    </div>
                    <p>
                      Participe do Desafio de Percepção Musical no palco ou acompanhe o alaúde de Lirael!
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="stage-launch-quiz-btn"
                      onClick={() => {
                        onPlaySoundEffect('interact');
                        setActiveStationModal(null);
                        setActiveQuizConfig({
                          mode: 'solo',
                          tableName: 'Palco Musical de Lirael',
                        });
                      }}
                      className="px-3 py-1.5 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-bold text-[#faf5e8] cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-[#f7d87c]" />
                      <span>Desafio de Adivinhação no Palco</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerMusicalReaction(
                          true,
                          `${appearance.adventurerName} dedilha um dueto harmônico com Lirael no Palco Musical!`
                        )
                      }
                      className="px-3 py-1.5 rounded border border-[#d9a738] bg-[#362013] hover:bg-[#4e342e] text-xs font-display font-bold text-[#f7d87c] cursor-pointer flex items-center gap-1.5"
                    >
                      <Music className="w-3.5 h-3.5 text-[#f7d87c]" />
                      <span>Tocar Ritmo Harmônico</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerMusicalReaction(
                          false,
                          `Uma corda desafinou no palco! ${appearance.adventurerName} reage ao acorde dissonante.`
                        )
                      }
                      className="px-3 py-1.5 rounded border border-[#9e7b1c]/70 bg-[#2b170e] hover:bg-[#3d2214] text-xs font-display font-semibold text-[#eadbc8] cursor-pointer flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#e8833a]" />
                      <span>Testar Acorde Desafinado</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. LIVRO DE COLECIONÁVEIS: CARTAS POR ARTISTA, BANDA E RARIDADE */}
              {activeStationModal.id === 'collectible_book' && (
                <div
                  data-testid="collectible-book-view"
                  className="pt-2 border-t border-[#9e7b1c]/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-display text-[11px] font-bold text-[#f7d87c]">
                      Grimório ({progression.unlockedArtistIds.length}/{QUIZ_ARTISTS_DB.length} Descobertas):
                    </span>
                    <div className="flex gap-1">
                      {(
                        [
                          { id: 'raridade', label: 'Por Raridade' },
                          { id: 'artista', label: 'Por Artista' },
                          { id: 'banda', label: 'Por Banda' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            onPlaySoundEffect('flip');
                            setCollectibleFilter(tab.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-display font-bold cursor-pointer border ${
                            collectibleFilter === tab.id
                              ? 'bg-[#6b1d2f] text-[#faf5e8] border-[#f7d87c]'
                              : 'bg-[#28150c] text-[#dfc9ad] border-[#9e7b1c]/40'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[195px] overflow-y-auto pr-0.5">
                    {[...QUIZ_ARTISTS_DB]
                      .sort((a, b) => {
                        if (collectibleFilter === 'artista') {
                          return a.name.localeCompare(b.name);
                        }
                        if (collectibleFilter === 'banda') {
                          return a.band.localeCompare(b.band);
                        }
                        return 0;
                      })
                      .map((artist) => {
                        const isUnlocked = progression.unlockedArtistIds.includes(
                          artist.id
                        );
                        const isSelected = selectedBookArtistId === artist.id;
                        return (
                          <button
                            key={artist.id}
                            type="button"
                            data-testid={`grimoire-card-${artist.id}`}
                            onClick={() => {
                              if (isUnlocked) {
                                onPlaySoundEffect('flip');
                                setSelectedBookArtistId(
                                  isSelected ? null : artist.id
                                );
                              }
                            }}
                            className={`rounded border-2 p-1.5 flex flex-col justify-between text-center transition-colors ${
                              isUnlocked
                                ? 'bg-[#28150c] cursor-pointer hover:brightness-110'
                                : 'bg-[#170d08] opacity-70 cursor-default'
                            }`}
                            style={{
                              borderColor: isUnlocked
                                ? isSelected
                                  ? '#f7d87c'
                                  : artist.rarityColor
                                : '#3d352e',
                            }}
                          >
                            <span className="font-display text-[8px] uppercase tracking-wider text-[#f7d87c] truncate w-full">
                              {isUnlocked
                                ? collectibleFilter === 'banda'
                                  ? artist.band
                                  : artist.rarity
                                : 'Selada'}
                            </span>
                            <div className="my-1 py-1.5 px-1 rounded bg-[#180c06] border border-[#9e7b1c]/30 font-display text-[10px] font-extrabold text-[#faf5e8] truncate w-full">
                              {isUnlocked ? artist.name : 'Carta Misteriosa'}
                            </div>
                            <span className="text-[8px] text-[#dfc9ad]/80 truncate w-full">
                              {isUnlocked ? artist.band : 'Vença no Quiz'}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  {selectedBookArtistId && (
                    <div className="rounded border border-[#8c6722] bg-[#f3e6cf] p-1.5 text-[#24130b]">
                      <CollectibleArtistPreview
                        artistId={selectedBookArtistId}
                        compact
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] italic text-[#dfc9ad]/85">
                      Clique em uma carta desbloqueada para inspecionar sua Dupla Identidade.
                    </p>
                    <button
                      type="button"
                      data-testid="book-launch-quiz-btn"
                      onClick={() => {
                        onPlaySoundEffect('interact');
                        setActiveStationModal(null);
                        setActiveQuizConfig({
                          mode: 'multiplayer',
                          tableName: 'Mesa Principal das Banquetas',
                        });
                      }}
                      className="px-2.5 py-1 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[10px] font-display font-bold text-[#faf5e8] cursor-pointer shrink-0"
                    >
                      Desbloquear Mais no Quiz
                    </button>
                  </div>
                </div>
              )}

              {/* 5. ESTANTE MUSICAL: ENCICLOPÉDIA DE ARTISTAS E BANDAS */}
              {activeStationModal.id === 'artist_shelf' && (
                <div className="pt-2 border-t border-[#9e7b1c]/40 bg-[#f3e6cf] text-[#24130b] p-2 rounded">
                  <CollectibleArtistPreview compact showFullEncyclopedia />
                </div>
              )}

              {/* 6. LOJA / EMPÓRIO MUSICAL (PREPARADO VISUALMENTE) */}
              {activeStationModal.id === 'tavern_shop' && (
                <div
                  data-testid="tavern-shop-preview"
                  className="pt-2 border-t border-[#9e7b1c]/40 space-y-2"
                >
                  <div className="rounded border border-[#d9a738]/60 bg-[#28150c] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-[#f7d87c] flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#d9a738]" />
                        <span>Mostruário do Empório (Em Preparação)</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#4a121f] text-[#f7d87c] font-display text-[9px] font-bold">
                        Em Breve
                      </span>
                    </div>
                    <p className="text-[11px] text-[#eadbc8]">
                      Este espaço na alcova sudeste foi preparado para receber futuramente o sistema de relíquias, visuais de instrumentos e adornos da taverna.
                    </p>
                  </div>
                </div>
              )}

              {/* 7. PORTA DE ENTRADA */}
              {activeStationModal.id === 'entrance_door' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#9e7b1c]/40">
                  <button
                    type="button"
                    onClick={onBackToConfirmationBook}
                    className="px-3 py-1.5 rounded border border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-xs font-display font-bold text-[#faf5e8] cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#f7d87c]" />
                    <span>Voltar à Página de Assinatura no Livro</span>
                  </button>
                </div>
              )}
            </div>
          ))}

        {/* TAVERN QUIZ MODAL (SOLO & TURN-BASED MULTIPLAYER UP TO 8 PLAYERS) */}
        {activeQuizConfig && (
          <TavernQuizModal
            hostPlayerId={traveler.id}
            hostPlayerName={appearance.adventurerName}
            initialMode={activeQuizConfig.mode}
            initialTableName={activeQuizConfig.tableName}
            unlockedArtistIds={progression.unlockedArtistIds}
            onRoundCompleted={(targetArtistId, didHostSolve, hostScore) => {
              setProgression((prev) =>
                recordQuizResultForPlayer(prev, targetArtistId, didHostSolve, hostScore)
              );
              if (didHostSolve) {
                setOverrideAnim('celebrate');
              }
            }}
            onPlaySoundEffect={onPlaySoundEffect}
            onStatusUpdate={(msg) => setStatusLog(msg)}
            onClose={() => setActiveQuizConfig(null)}
          />
        )}
      </div>

      {/* 3. SLEEK SINGLE-ROW MEDIEVAL HUD DOCK (Visual Shortcuts + Discreet Secondary Drawer Button) */}
      <div className="rounded-b-xl border-2 border-[#9e7b1c]/80 bg-[#1b0f09]/95 px-2.5 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.95)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-1.5">
        {/* Left: Compact Visual Shortcuts for the Tavern's Interactive Systems */}
        <div className="flex items-center gap-1 overflow-x-auto sm:flex-wrap pb-0.5 sm:pb-0">
          {TAVERN_INTERACTIVE_STATIONS.map((st) => {
            const isNear = nearbyStation?.id === st.id;
            return (
              <button
                key={st.id}
                type="button"
                data-testid={`station-btn-${st.id}`}
                onClick={() => navigateToStationAndInteract(st)}
                className={`px-2 py-1 rounded border text-[10px] sm:text-[11px] font-display font-bold tracking-wide cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors ${
                  isNear
                    ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                    : 'border-[#9e7b1c]/55 bg-[#28150c] text-[#eadbc8] hover:border-[#f7d87c]'
                }`}
              >
                {st.id === 'counter_barnaby' && (
                  <Sparkles className="w-3 h-3 text-[#f7d87c]" />
                )}
                {st.id === 'collectible_book' && (
                  <Layers className="w-3 h-3 text-[#f7d87c]" />
                )}
                {st.id === 'musical_stage' && (
                  <Music className="w-3 h-3 text-[#f7d87c]" />
                )}
                {st.id === 'tables_stools' && (
                  <UtensilsCrossed className="w-3 h-3 text-[#d9a738]" />
                )}
                {st.id === 'notice_board' && (
                  <ScrollText className="w-3 h-3 text-[#dfc9ad]" />
                )}
                {st.id === 'artist_shelf' && (
                  <BookOpen className="w-3 h-3 text-[#f7d87c]" />
                )}
                {st.id === 'hearth_fireplace' && (
                  <Flame className="w-3 h-3 text-[#e8833a]" />
                )}
                {st.id === 'tavern_shop' && (
                  <ShoppingBag className="w-3 h-3 text-[#d9a738]" />
                )}
                {st.id === 'entrance_door' && (
                  <DoorOpen className="w-3 h-3 text-[#d9a738]" />
                )}
                <span>{st.shortPrompt}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Discreet Secondary Controls Toggle + Character Creator + Guestbook */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="toggle-controls-drawer-btn"
            aria-expanded={isSecondaryDrawerOpen}
            onClick={() => {
              onPlaySoundEffect('quill');
              setIsSecondaryDrawerOpen((prev) => !prev);
            }}
            className={`px-2.5 py-1 rounded border text-[11px] font-display font-bold cursor-pointer flex items-center gap-1 transition-colors ${
              isSecondaryDrawerOpen
                ? 'border-[#f7d87c] bg-[#6b1d2f] text-[#faf5e8]'
                : 'border-[#9e7b1c]/80 bg-[#2b170e] text-[#f7d87c] hover:border-[#f7d87c]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#f7d87c]" />
            <span>Gestos & Banquetas</span>
            {isSecondaryDrawerOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>

          <button
            type="button"
            data-testid="btn-open-character-creator"
            onClick={onOpenCharacterCreator}
            className="inline-flex items-center gap-1 py-1 px-2.5 rounded border-2 border-[#f7d87c] bg-[#6b1d2f] hover:bg-[#82243a] text-[#faf5e8] font-display text-[11px] font-bold tracking-wide cursor-pointer whitespace-nowrap shadow"
          >
            <UserCog className="w-3.5 h-3.5 text-[#f7d87c]" />
            <span>Personalizar</span>
          </button>

          <button
            type="button"
            onClick={onBackToConfirmationBook}
            className="inline-flex items-center gap-1 py-1 px-2 rounded border border-[#9e7b1c]/80 bg-[#2e190f] hover:bg-[#3d2214] text-[#f4ebd9] font-display text-[11px] font-bold cursor-pointer whitespace-nowrap"
            title="Voltar à Página de Assinatura no Livro"
          >
            <Compass className="w-3.5 h-3.5 text-[#d9a738]" />
            <span className="hidden sm:inline">#{traveler.entryNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Pre-renders the static Stardew Valley-inspired Tavern Hall tilemap onto a 1152x576 canvas.
 * Includes warm honey-oak floorboards with bevels/dowels, stone & wood-wainscoting walls,
 * back-bar bottle shelves, woven fringed rugs, barrels, crates, framed art, stage & stairs.
 */
function buildStardewTavernStaticTilemap(ctx: CanvasRenderingContext2D): void {
  const OUTLINE = '#1e0d07';
  const GOLD = '#d9a738';
  const GOLD_LIGHT = '#f7d87c';

  // --- 1. WARM HONEY & CHESTNUT OAK PLANK FLOOR (Stardew Saloon Palette) ---
  ctx.fillStyle = '#261309';
  ctx.fillRect(0, 128, WORLD_WIDTH, WORLD_HEIGHT - 128);

  const plankTones = ['#5c351b', '#512d16', '#643a1e', '#563118'];
  const plankBevels = ['#734424', '#663b1f', '#7c4a28', '#6b3e21'];

  for (let r = 4; r < GRID_ROWS; r++) {
    const y = r * TILE_SIZE;
    const tone = plankTones[r % plankTones.length];
    const bevel = plankBevels[r % plankBevels.length];

    // Main plank body
    ctx.fillStyle = tone;
    ctx.fillRect(48, y, WORLD_WIDTH - 96, TILE_SIZE - 2);
    // Warm top bevel highlight
    ctx.fillStyle = bevel;
    ctx.fillRect(48, y, WORLD_WIDTH - 96, 3);
    // Subtle lower plank shadow before seam
    ctx.fillStyle = '#3d2110';
    ctx.fillRect(48, y + TILE_SIZE - 5, WORLD_WIDTH - 96, 3);
    // Crisp dark espresso seam between plank rows
    ctx.fillStyle = '#211007';
    ctx.fillRect(48, y + TILE_SIZE - 2, WORLD_WIDTH - 96, 2);

    const offset = (r % 3) * 44;
    for (let x = 48 + offset; x < WORLD_WIDTH - 48; x += 112) {
      // Vertical plank joint
      ctx.fillStyle = '#211007';
      ctx.fillRect(x, y, 2, TILE_SIZE);
      ctx.fillStyle = bevel;
      ctx.fillRect(x + 2, y + 2, 2, TILE_SIZE - 6);
      // Wooden dowel nails
      ctx.fillStyle = '#331a0c';
      ctx.fillRect(x + 5, y + 6, 3, 3);
      ctx.fillRect(x + 5, y + TILE_SIZE - 10, 3, 3);
      ctx.fillRect(x - 6, y + 6, 3, 3);
      ctx.fillRect(x - 6, y + TILE_SIZE - 10, 3, 3);

      // Subtle wood grain lines & knots
      ctx.fillStyle = '#472713';
      ctx.fillRect(x + 18, y + 11, 34, 2);
      ctx.fillRect(x + 58, y + 19, 28, 2);
      if ((x + r) % 4 === 0) {
        ctx.fillStyle = '#3b1f0e';
        ctx.fillRect(x + 42, y + 13, 8, 5);
        ctx.fillStyle = '#6e4022';
        ctx.fillRect(x + 44, y + 14, 4, 2);
      }
    }
  }

  // Stone hearth floor apron under fireplace
  ctx.fillStyle = '#211007';
  ctx.fillRect(284, 152, 200, 26);
  const apronStones = ['#595048', '#4a423b', '#665c53', '#524942'];
  for (let sx = 288; sx < 478; sx += 24) {
    ctx.fillStyle = apronStones[(sx / 24) % apronStones.length];
    ctx.fillRect(sx, 155, 22, 19);
    ctx.fillStyle = '#756a60';
    ctx.fillRect(sx + 1, 156, 20, 2);
  }

  // --- 2. WOVEN PIXEL-PATTERNED RUGS WITH FRINGES (Tapetes Medievais) ---
  const drawWovenRug = (
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    baseColor: string,
    innerColor: string,
    borderColor: string
  ) => {
    // Drop shadow
    ctx.fillStyle = 'rgba(18, 8, 4, 0.45)';
    ctx.fillRect(rx - 2, ry + 2, rw + 4, rh);
    // Fringes on left and right edges
    ctx.fillStyle = '#e8d8b9';
    for (let fy = ry + 3; fy < ry + rh - 3; fy += 5) {
      ctx.fillRect(rx - 4, fy, 4, 3);
      ctx.fillRect(rx + rw, fy, 4, 3);
    }
    // Outer outline
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(rx, ry, rw, rh);
    // Main woven body
    ctx.fillStyle = baseColor;
    ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
    // Gold ornamental border
    ctx.fillStyle = borderColor;
    ctx.fillRect(rx + 6, ry + 6, rw - 12, rh - 12);
    // Inner field
    ctx.fillStyle = innerColor;
    ctx.fillRect(rx + 9, ry + 9, rw - 18, rh - 18);
    // Center diamond pixel motif
    const cx = Math.round(rx + rw / 2);
    const cy = Math.round(ry + rh / 2);
    ctx.fillStyle = borderColor;
    ctx.fillRect(cx - 10, cy - 3, 20, 6);
    ctx.fillRect(cx - 5, cy - 7, 10, 14);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(cx - 3, cy - 2, 6, 4);
  };

  // 1) Cozy Hearth Rug in front of the Fireplace
  drawWovenRug(302, 178, 164, 62, '#6b1d2f', '#82243a', GOLD);
  // 2) Entrance Runner Carpet (South Door to Central Table)
  drawWovenRug(514, 458, 124, 76, '#5c1626', '#751e31', GOLD);
  // 3) Under-Table Woven Rugs (West & East Round Tables)
  drawWovenRug(196, 336, 172, 108, '#294a30', '#335c3c', '#c59b27');
  drawWovenRug(792, 340, 172, 108, '#293e5c', '#344f75', '#c59b27');
  // 4) Merchant Shop Carpet in South-East Alcove
  drawWovenRug(964, 424, 128, 92, '#3d2247', '#522e5e', GOLD);

  // --- 3. RAISED MUSICAL STAGE PLATFORM & CARVED WOODEN STAIRS (Palco & Escadas) ---
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(846, 132, 252, 156);
  // Stage front riser (3D wooden face)
  ctx.fillStyle = '#3d2110';
  ctx.fillRect(850, 266, 244, 20);
  ctx.fillStyle = GOLD;
  ctx.fillRect(850, 268, 244, 2);
  // Stage honey-oak deck planks
  ctx.fillStyle = '#6e4022';
  ctx.fillRect(850, 136, 244, 132);
  for (let sy = 148; sy < 266; sy += 16) {
    ctx.fillStyle = '#472814';
    ctx.fillRect(850, sy, 244, 2);
  }
  // Crimson velvet stage performance carpet
  drawWovenRug(872, 148, 202, 110, '#6b1d2f', '#87233a', GOLD_LIGHT);

  // Carved Wooden Stage Stairs (Left side of stage)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(842, 232, 42, 52);
  for (let step = 0; step < 3; step++) {
    const sy = 236 + step * 15;
    ctx.fillStyle = '#754526';
    ctx.fillRect(845, sy, 36, 10);
    ctx.fillStyle = GOLD;
    ctx.fillRect(845, sy, 36, 2);
    ctx.fillStyle = '#3b2010';
    ctx.fillRect(845, sy + 10, 36, 4);
  }

  // Brass Footlight Lanterns along front of Stage
  const footlights = [896, 948, 1000, 1052];
  for (const fx of footlights) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(fx - 5, 260, 10, 8);
    ctx.fillStyle = GOLD;
    ctx.fillRect(fx - 4, 261, 8, 6);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(fx - 2, 262, 4, 3);
  }

  // --- 4. NORTH WALL: COBBLESTONE MASONRY + STARDEW WOOD WAINSCOTING ---
  ctx.fillStyle = '#241711';
  ctx.fillRect(0, 0, WORLD_WIDTH, 128);

  // Upper Dressed Cobblestone Wall (y: 10..82)
  const stonePalette = ['#3d2f27', '#4a392f', '#352820', '#43332a'];
  for (let wy = 12; wy < 80; wy += 18) {
    const rowShift = (Math.floor(wy / 18) % 2) * 22;
    for (let wx = 48 + rowShift; wx < WORLD_WIDTH - 48; wx += 46) {
      const wStone = 42;
      const hStone = 15;
      ctx.fillStyle = '#1b110c';
      ctx.fillRect(wx, wy, wStone, hStone);
      ctx.fillStyle = stonePalette[(wx + wy) % stonePalette.length];
      ctx.fillRect(wx + 1, wy + 1, wStone - 2, hStone - 2);
      // Top-left stone bevel highlight
      ctx.fillStyle = '#59463b';
      ctx.fillRect(wx + 2, wy + 2, wStone - 5, 2);
    }
  }

  // Lower Carved Oak Wainscoting Panels (y: 82..126)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(48, 80, WORLD_WIDTH - 96, 48);
  ctx.fillStyle = '#6e4022'; // Chair rail moulding
  ctx.fillRect(48, 82, WORLD_WIDTH - 96, 5);
  ctx.fillStyle = GOLD;
  ctx.fillRect(48, 84, WORLD_WIDTH - 96, 1);
  ctx.fillStyle = '#4f2d17';
  ctx.fillRect(48, 87, WORLD_WIDTH - 96, 35);
  for (let px = 56; px < WORLD_WIDTH - 64; px += 32) {
    ctx.fillStyle = '#381e0e';
    ctx.fillRect(px, 90, 26, 28);
    ctx.fillStyle = '#5e361c';
    ctx.fillRect(px + 2, 92, 22, 24);
    ctx.fillStyle = '#734424';
    ctx.fillRect(px + 3, 93, 20, 2);
  }
  // Baseboard trim
  ctx.fillStyle = '#2e180b';
  ctx.fillRect(48, 122, WORLD_WIDTH - 96, 6);

  // Exposed Vertical Timber Wall Beams with Brass Brackets
  ctx.fillStyle = '#2b160b';
  ctx.fillRect(0, 0, WORLD_WIDTH, 12);
  for (let bx = 48; bx < WORLD_WIDTH; bx += 184) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(bx - 1, 0, 16, 128);
    ctx.fillStyle = '#3d2110';
    ctx.fillRect(bx + 1, 0, 12, 128);
    ctx.fillStyle = '#543019';
    ctx.fillRect(bx + 3, 0, 4, 128);
    // Brass rivets on beam
    ctx.fillStyle = GOLD;
    ctx.fillRect(bx + 3, 18, 8, 3);
    ctx.fillRect(bx + 3, 82, 8, 3);
  }

  // --- 5. BACK-BAR BOTTLE SHELVES & MEAD BARRELS BEHIND BARNABY (x: 526..740) ---
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(528, 16, 142, 74);
  ctx.fillStyle = '#2b160b';
  ctx.fillRect(531, 19, 136, 68);
  ctx.fillStyle = '#6e4022';
  ctx.fillRect(531, 19, 136, 4);
  ctx.fillRect(531, 42, 136, 4);
  ctx.fillRect(531, 65, 136, 4);

  // Colorful Pixel Art Elixir, Mead & Wine Bottles on Back-Bar Shelves
  const bottleColors = [
    '#2e7d32',
    '#c62828',
    '#f57f17',
    '#1565c0',
    '#6a1b9a',
    '#d9a738',
    '#00838f',
  ];
  for (let row = 0; row < 2; row++) {
    const by = row === 0 ? 26 : 49;
    for (let i = 0; i < 9; i++) {
      const bx = 537 + i * 14;
      const bColor = bottleColors[(i + row * 3) % bottleColors.length];
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(bx - 1, by + 2, 9, 14);
      ctx.fillStyle = bColor;
      ctx.fillRect(bx, by + 3, 7, 12);
      // Glass highlight & cork
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 1, by + 5, 2, 5);
      ctx.fillStyle = '#e6c280';
      ctx.fillRect(bx + 2, by, 3, 3);
    }
  }

  // Framed Landscape Painting & Mounted Heraldic Shield on North Wall
  // Painting right of Back-Bar Shelf
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(680, 22, 56, 44);
  ctx.fillStyle = GOLD;
  ctx.fillRect(682, 24, 52, 40);
  ctx.fillStyle = '#1e2c3a';
  ctx.fillRect(686, 28, 44, 32);
  ctx.fillStyle = '#f7d87c'; // Moon
  ctx.fillRect(718, 32, 6, 6);
  ctx.fillStyle = '#3b5e3c'; // Hills
  ctx.fillRect(686, 46, 44, 14);

  // Mounted Heraldic Shield & Crossed Lutes (Left of Fireplace)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(252, 24, 34, 40);
  ctx.fillStyle = GOLD;
  ctx.fillRect(254, 26, 30, 36);
  ctx.fillStyle = '#6b1d2f';
  ctx.fillRect(257, 29, 24, 30);
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillRect(267, 33, 4, 22);
  ctx.fillRect(261, 41, 16, 4);

  // Stage Back-Wall Crimson Velvet Valance Banner (North-East above Stage)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(862, 14, 114, 32);
  ctx.fillStyle = '#6b1d2f';
  ctx.fillRect(864, 16, 110, 26);
  ctx.fillStyle = GOLD;
  ctx.fillRect(864, 16, 110, 4);
  ctx.fillRect(864, 40, 110, 3);

  // Wall Sconce Iron Brackets & Wax Candles
  const sconceXList = [80, 280, 496, 748, 948];
  for (const sx of sconceXList) {
    const sy = 50;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(sx - 5, sy + 2, 10, 14);
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(sx - 3, sy + 4, 6, 10);
    ctx.fillStyle = GOLD;
    ctx.fillRect(sx - 6, sy + 2, 12, 3);
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(sx - 3, sy - 5, 6, 7);
  }

  // Leaded-Glass Medieval Windows on North Wall
  const windowPositions = [776, 984];
  for (const winX of windowPositions) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(winX - 6, 18, 76, 78);
    ctx.fillStyle = '#59341d';
    ctx.fillRect(winX - 4, 20, 72, 74);
    ctx.fillStyle = '#182b49';
    ctx.fillRect(winX, 24, 64, 66);
    // Warm interior window sill with small potted herb/candle
    ctx.fillStyle = '#754526';
    ctx.fillRect(winX - 6, 88, 76, 6);
    ctx.fillStyle = GOLD;
    ctx.fillRect(winX - 4, 88, 72, 2);
  }

  // --- 6. DECORATIVE OAK BARRELS (Barris) & WOODEN CRATES (Caixas) ---
  const drawOakBarrel = (bx: number, by: number) => {
    ctx.fillStyle = 'rgba(14, 7, 3, 0.5)';
    ctx.fillRect(bx - 2, by + 24, 32, 8);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(bx + 2, by, 24, 30);
    ctx.fillRect(bx, by + 4, 28, 22);
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(bx + 2, by + 2, 24, 26);
    ctx.fillStyle = '#85502d';
    ctx.fillRect(bx + 6, by + 2, 10, 26);
    // Iron barrel hoops
    ctx.fillStyle = '#2b2d2f';
    ctx.fillRect(bx + 1, by + 7, 26, 3);
    ctx.fillRect(bx + 1, by + 20, 26, 3);
    // Top lid bevel & brass tap
    ctx.fillStyle = '#4f2d17';
    ctx.fillRect(bx + 4, by + 2, 20, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(bx + 12, by + 14, 4, 5);
  };

  const drawWoodenCrate = (cx: number, cy: number) => {
    ctx.fillStyle = 'rgba(14, 7, 3, 0.5)';
    ctx.fillRect(cx - 2, cy + 22, 30, 7);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx, cy, 26, 26);
    ctx.fillStyle = '#734424';
    ctx.fillRect(cx + 2, cy + 2, 22, 22);
    ctx.fillStyle = '#522e17';
    ctx.fillRect(cx + 5, cy + 5, 16, 16);
    // Diagonal crate brace
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(cx + 2, cy + 11, 22, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(cx + 4, cy + 4, 2, 2);
    ctx.fillRect(cx + 20, cy + 4, 2, 2);
  };

  // Cluster of Mead Barrels & Crates in corners/alcoves (outside walkable collision paths)
  drawOakBarrel(54, 130);
  drawWoodenCrate(54, 164);
  drawOakBarrel(482, 126);
  drawOakBarrel(784, 126);
  drawWoodenCrate(1062, 134);
  drawOakBarrel(54, 486);

  // --- 7. PERIMETER WALLS & ORNATE DOUBLE ENTRANCE DOORS ---
  ctx.fillStyle = '#1b0f08';
  ctx.fillRect(0, 0, 48, WORLD_HEIGHT);
  ctx.fillRect(WORLD_WIDTH - 48, 0, 48, WORLD_HEIGHT);
  ctx.fillStyle = '#4f2d17';
  ctx.fillRect(40, 0, 8, WORLD_HEIGHT);
  ctx.fillRect(WORLD_WIDTH - 48, 0, 8, WORLD_HEIGHT);
  ctx.fillStyle = GOLD;
  ctx.fillRect(46, 0, 2, WORLD_HEIGHT);
  ctx.fillRect(WORLD_WIDTH - 48, 0, 2, WORLD_HEIGHT);

  // South wall & Entrance Door Frame
  ctx.fillStyle = '#1b0f08';
  ctx.fillRect(0, WORLD_HEIGHT - 40, 460, 40);
  ctx.fillRect(692, WORLD_HEIGHT - 40, 460, 40);
  ctx.fillStyle = '#4f2d17';
  ctx.fillRect(0, WORLD_HEIGHT - 40, 460, 8);
  ctx.fillRect(692, WORLD_HEIGHT - 40, 460, 8);

  // Entrance Double Oak Doors at (460..692, 536..576) with iron hinges & welcome mat
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(458, WORLD_HEIGHT - 38, 236, 38);
  ctx.fillStyle = '#5c351b';
  ctx.fillRect(462, WORLD_HEIGHT - 35, 228, 33);
  ctx.fillStyle = '#422411';
  ctx.fillRect(470, WORLD_HEIGHT - 30, 98, 24);
  ctx.fillRect(584, WORLD_HEIGHT - 30, 98, 24);
  ctx.fillStyle = GOLD;
  ctx.fillRect(460, WORLD_HEIGHT - 36, 232, 4);
  ctx.fillRect(574, WORLD_HEIGHT - 36, 4, 34);
  ctx.fillRect(560, WORLD_HEIGHT - 22, 8, 8);
  ctx.fillRect(584, WORLD_HEIGHT - 22, 8, 8);

  // --- 8. INTERACTIVE ROUND WOODEN TAVERN STOOLS (Banquetas) ---
  for (const stool of TAVERN_SEAT_STOOLS) {
    const sx = stool.x;
    const sy = stool.y;
    // Floor shadow
    ctx.fillStyle = 'rgba(14, 7, 3, 0.5)';
    ctx.fillRect(sx - 11, sy - 2, 22, 12);
    // Turned wooden legs
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(sx - 8, sy, 4, 9);
    ctx.fillRect(sx + 4, sy, 4, 9);
    ctx.fillStyle = '#3d2110';
    ctx.fillRect(sx - 7, sy, 2, 8);
    ctx.fillRect(sx + 5, sy, 2, 8);
    // Rounded cushioned/carved seat top
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(sx - 10, sy - 10, 20, 11);
    ctx.fillRect(sx - 8, sy - 11, 16, 13);
    ctx.fillStyle = '#754526';
    ctx.fillRect(sx - 8, sy - 9, 16, 8);
    ctx.fillStyle = '#945a33';
    ctx.fillRect(sx - 6, sy - 9, 12, 3);
    ctx.fillStyle = GOLD;
    ctx.fillRect(sx - 2, sy - 5, 4, 2);
  }
}

/**
 * Draws a living Stardew Valley-inspired 16-bit Pixel Art Tavern NPC
 * (Bartender, Stage Musician, Seated Table Patron, or Strolling Server)
 * with rounded head contours, expressive eyes with catchlights, hats, walking legs, and speech bubbles.
 */
function drawTavernNpcPixelSprite(
  ctx: CanvasRenderingContext2D,
  state: NpcRuntimeState,
  elapsedSec: number
): void {
  const {
    npc,
    x: worldX,
    y: worldY,
    facing,
    isWalking,
    walkStep,
    activity,
    isPlayerNear,
    isBlinking,
    breathOffset,
    activeSpeech,
  } = state;

  const OUTLINE = '#1e0d07';
  const GOLD = '#d9a738';
  const GOLD_LIGHT = '#f7d87c';

  const x = Math.round(worldX - 24);
  const y = Math.round(worldY - 56 + breathOffset);

  // 0. Coherent elliptical floor drop shadow
  ctx.fillStyle = 'rgba(14, 7, 3, 0.48)';
  ctx.fillRect(x + 8, Math.round(worldY - 5), 32, 9);

  // 1. If NPC is a seated patron, draw their carved wooden tavern chair/stool underneath
  if (npc.isSeated) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 10, Math.round(worldY - 18), 28, 16);
    ctx.fillStyle = '#5c351b';
    ctx.fillRect(x + 12, Math.round(worldY - 16), 24, 8);
    ctx.fillStyle = '#3b2010';
    ctx.fillRect(x + 13, Math.round(worldY - 8), 5, 8);
    ctx.fillRect(x + 30, Math.round(worldY - 8), 5, 8);
  } else if (npc.role !== 'bartender') {
    // Standing or walking legs & boots
    const leftUp = isWalking ? (walkStep === 1 ? -3 : walkStep === 3 ? 2 : 0) : 0;
    const rightUp = isWalking ? (walkStep === 3 ? -3 : walkStep === 1 ? 2 : 0) : 0;

    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 13, y + 44 + leftUp, 9, 12);
    ctx.fillRect(x + 26, y + 44 + rightUp, 9, 12);
    ctx.fillStyle = '#2b1d16';
    ctx.fillRect(x + 15, y + 44 + leftUp, 5, 7);
    ctx.fillRect(x + 28, y + 44 + rightUp, 5, 7);
    ctx.fillStyle = '#4a2916';
    ctx.fillRect(x + 14, y + 51 + leftUp, 7, 4);
    ctx.fillRect(x + 27, y + 51 + rightUp, 7, 4);
  }

  // 2. Rounded Torso & Stardew Medieval Tunic / Apron
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x + 10, y + 23, 28, 23);
  ctx.fillStyle = npc.tunicColor;
  ctx.fillRect(x + 12, y + 25, 24, 19);
  ctx.fillStyle = npc.accentColor;
  ctx.fillRect(x + 20, y + 25, 8, 17);

  // Bartender or Server crisp cream apron
  if (npc.role === 'bartender' || npc.role === 'server') {
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(x + 15, y + 33, 18, 11);
    ctx.fillStyle = '#d9a738';
    ctx.fillRect(x + 14, y + 32, 20, 2);
  } else {
    // Leather belt with brass buckle
    ctx.fillStyle = '#2b160b';
    ctx.fillRect(x + 12, y + 39, 24, 3);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 22, y + 39, 4, 3);
  }

  // 3. Rounded Stardew-style Head, Ears, Blush & Expressive Eyes
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x + 13, y + 2, 22, 1);
  ctx.fillRect(x + 11, y + 3, 26, 20);
  ctx.fillRect(x + 13, y + 23, 22, 1);

  // Hair Crown & Side Locks
  ctx.fillStyle = npc.hairColor;
  ctx.fillRect(x + 12, y + 3, 24, 8);
  ctx.fillRect(x + 11, y + 7, 4, 11);
  ctx.fillRect(x + 33, y + 7, 4, 11);

  // Face Skin
  ctx.fillStyle = npc.skinColor;
  ctx.fillRect(x + 14, y + 9, 20, 13);

  // Rosy Cheek Blush
  ctx.fillStyle = 'rgba(219, 101, 88, 0.55)';
  ctx.fillRect(x + 14, y + 16, 3, 2);
  ctx.fillRect(x + 31, y + 16, 3, 2);

  // Eyes with 1x1 white catchlights
  const eyeShift = facing === 'left' ? -1 : 1;
  if (isBlinking) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 17 + eyeShift, y + 14, 4, 2);
    ctx.fillRect(x + 27 + eyeShift, y + 14, 4, 2);
  } else {
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(x + 17 + eyeShift, y + 12, 4, 4);
    ctx.fillRect(x + 27 + eyeShift, y + 12, 4, 4);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 18 + eyeShift, y + 13, 3, 3);
    ctx.fillRect(x + 28 + eyeShift, y + 13, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 18 + eyeShift, y + 12, 2, 2);
    ctx.fillRect(x + 28 + eyeShift, y + 12, 2, 2);
  }

  // Beard / Mustache for Barnaby & Garrick
  if (npc.id === 'npc_barnaby' || npc.id === 'npc_garrick') {
    ctx.fillStyle = npc.hairColor;
    ctx.fillRect(x + 14, y + 18, 20, 5);
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(x + 21, y + 19, 6, 2);
  } else {
    // Warm smile
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 22, y + 19, 4, 2);
  }

  // 4. Hats & Headgear
  if (npc.hatType === 'beret') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 10, y - 2, 28, 6);
    ctx.fillStyle = npc.tunicColor;
    ctx.fillRect(x + 12, y - 1, 24, 4);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 33, y - 6, 4, 6);
  } else if (npc.hatType === 'circlet') {
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 12, y + 6, 24, 2);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 22, y + 5, 4, 3);
  } else if (npc.hatType === 'bandana') {
    ctx.fillStyle = '#294a30';
    ctx.fillRect(x + 12, y + 4, 24, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 12, y + 7, 24, 1);
  } else if (npc.hatType === 'hood') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 10, y, 28, 7);
    ctx.fillStyle = '#472814';
    ctx.fillRect(x + 12, y + 1, 24, 5);
  }

  // 5. Activity-specific Pixel Art Props & Hand Animations
  const handWave = Math.floor(elapsedSec * 5 + npc.phaseOffset) % 2;

  if (npc.role === 'musician') {
    // 16-Bit Lute held across chest + strumming hand + rising musical note pixel icon
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 7, y + 29, 20, 14);
    ctx.fillStyle = '#c8641e';
    ctx.fillRect(x + 9, y + 31, 16, 10);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 12, y + 33, 10, 6);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 15, y + 34, 4, 4);
    ctx.fillStyle = '#472816';
    ctx.fillRect(x + 26, y + 26, 11, 4);
    // Strumming hand
    ctx.fillStyle = npc.skinColor;
    ctx.fillRect(x + 15, y + 33 + handWave * 2, 4, 4);

    // Floating pixel musical notes to the right of Lirael's nameplate
    const noteY = y - 8 - Math.floor((elapsedSec * 14) % 14);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 42, noteY, 4, 4);
    ctx.fillRect(x + 45, noteY - 6, 2, 6);
    ctx.fillRect(x + 45, noteY - 6, 5, 2);
  } else if (npc.role === 'bartender') {
    if (activity === 'greeting_player') {
      ctx.fillStyle = npc.skinColor;
      ctx.fillRect(x + 36, y + 18 - handWave * 3, 6, 8);
    } else {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + 27 + handWave, y + 29, 12, 14);
      ctx.fillStyle = '#8c6722';
      ctx.fillRect(x + 28 + handWave, y + 31, 10, 11);
      ctx.fillStyle = '#faf5e8';
      ctx.fillRect(x + 28 + handWave, y + 29, 10, 3);
    }
  } else if (npc.role === 'server') {
    // Strolling server Elena carrying a silver/brass tray with frothy mead goblets
    const trayX = facing === 'left' ? x - 2 : x + 26;
    const trayY = y + 26 + (isWalking ? (walkStep % 2) : handWave);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(trayX - 1, trayY + 6, 22, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(trayX, trayY + 7, 20, 2);
    // Two mini mugs on tray
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(trayX + 3, trayY, 6, 7);
    ctx.fillRect(trayX + 11, trayY, 6, 7);
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(trayX + 3, trayY - 2, 6, 2);
    ctx.fillRect(trayX + 11, trayY - 2, 6, 2);
  } else {
    // Seated Table Patrons: holding frothy mug or scroll
    const sipOffset = activity === 'sipping_drink' ? -4 : 0;
    if (activity === 'reading_scroll') {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + 25, y + 27 + handWave, 14, 12);
      ctx.fillStyle = '#f3e6cf';
      ctx.fillRect(x + 26, y + 28 + handWave, 12, 10);
      ctx.fillStyle = '#6b1d2f';
      ctx.fillRect(x + 28, y + 32 + handWave, 8, 2);
    } else {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + 27, y + 28 + sipOffset - handWave, 11, 13);
      ctx.fillStyle = '#6e4022';
      ctx.fillRect(x + 28, y + 30 + sipOffset - handWave, 9, 10);
      ctx.fillStyle = '#faf5e8';
      ctx.fillRect(x + 28, y + 28 + sipOffset - handWave, 9, 3);
    }
  }

  // 6. NPC Name Tag
  ctx.font = 'bold 9.5px Cinzel, serif';
  ctx.fillStyle = isPlayerNear ? GOLD_LIGHT : 'rgba(250, 245, 232, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, Math.round(worldX), y - 5);

  // 7. Subtle Medieval Speech / Activity Bubble when active
  if (activeSpeech) {
    ctx.font = isPlayerNear
      ? 'bold 10px Cormorant Garamond, serif'
      : 'italic 10px Cormorant Garamond, serif';
    const maxBubbleText =
      activeSpeech.length > 44 ? `${activeSpeech.slice(0, 42)}...` : activeSpeech;
    const bw = Math.min(230, ctx.measureText(maxBubbleText).width + 14);
    const bx = Math.round(Math.max(54, Math.min(WORLD_WIDTH - bw - 54, worldX - bw / 2)));
    const by = y - 28;

    ctx.fillStyle = isPlayerNear ? 'rgba(42, 18, 12, 0.95)' : 'rgba(24, 13, 7, 0.88)';
    ctx.fillRect(bx, by, bw, 17);
    ctx.strokeStyle = isPlayerNear ? GOLD_LIGHT : 'rgba(217, 167, 56, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, 17);

    ctx.fillStyle = isPlayerNear ? '#faf5e8' : '#eadbc8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxBubbleText, Math.round(bx + bw / 2), by + 8.5);
  }
}

/**
 * Renders each 3/4-perspective tavern furniture & architectural obstacle in Stardew Valley-grade pixel art.
 */
function drawObstacle3Quarter(
  ctx: CanvasRenderingContext2D,
  obs: WorldObstacle,
  elapsedSec: number
): void {
  const { x, y, width: w, height: h, kind } = obs;
  const OUTLINE = '#1e0d07';
  const GOLD = '#d9a738';
  const GOLD_LIGHT = '#f7d87c';

  // Coherent Drop Shadow on Floor
  ctx.fillStyle = 'rgba(14, 7, 3, 0.52)';
  ctx.fillRect(x - 4, y + h - 6, w + 8, 12);

  if (kind === 'hearth') {
    // Cobblestone Fireplace Chimney & Roaring Pixel Flames + Rising Smoke
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 36, w + 4, h + 38);
    ctx.fillStyle = '#4a413a';
    ctx.fillRect(x, y - 34, w, h + 34);

    // Individual dressed stone blocks on fireplace facade
    const hearthStones = ['#5e534a', '#524840', '#695d53', '#473e37'];
    for (let sy = y - 30; sy < y + h - 8; sy += 14) {
      for (let sx = x + 6; sx < x + w - 18; sx += 26) {
        if (sx > x + 26 && sx < x + w - 42 && sy > y + 2) continue; // Firebox cutout
        ctx.fillStyle = hearthStones[(sx + sy) % hearthStones.length];
        ctx.fillRect(sx, sy, 23, 11);
        ctx.fillStyle = '#786b60';
        ctx.fillRect(sx + 1, sy + 1, 20, 2);
      }
    }

    // Carved Oak Mantelpiece with brass trim & candles
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 8, y - 12, w + 16, 16);
    ctx.fillStyle = '#5c351b';
    ctx.fillRect(x - 6, y - 10, w + 12, 12);
    ctx.fillStyle = '#784828';
    ctx.fillRect(x - 6, y - 10, w + 12, 3);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x, y - 4, w, 2);

    // Mantelpiece candles & golden goblet
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(x + 14, y - 22, 5, 10);
    ctx.fillRect(x + w - 19, y - 22, 5, 10);
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(x + 15, y - 26, 3, 4);
    ctx.fillRect(x + w - 18, y - 26, 3, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + Math.floor(w / 2) - 4, y - 20, 8, 8);

    // Arched Firebox opening
    ctx.fillStyle = '#120804';
    ctx.fillRect(x + 28, y + 8, w - 56, h - 8);
    ctx.fillStyle = '#261209';
    ctx.fillRect(x + 32, y + 12, w - 64, h - 14);

    // 4-Layer Animated Pixel Flames
    const fShift = Math.floor(elapsedSec * 9) % 3;
    ctx.fillStyle = '#d84315';
    ctx.fillRect(x + 38, y + 22 - fShift * 3, w - 76, h - 24);
    ctx.fillStyle = '#ff8f00';
    ctx.fillRect(x + 48, y + 30 - ((fShift + 1) % 3) * 4, w - 96, h - 34);
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(x + 58, y + 38 - fShift * 2, w - 116, h - 42);
    ctx.fillStyle = '#fff59d';
    ctx.fillRect(x + 68, y + 46 - fShift, w - 136, h - 50);

    // Glowing oak logs & iron grate
    ctx.fillStyle = '#3b1e0e';
    ctx.fillRect(x + 36, y + h - 13, w - 72, 8);
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(x + 54, y + h - 11, w - 108, 3);

    // Soft Rising Smoke Wisps
    for (let s = 0; s < 3; s++) {
      const smokeY = y - 16 - ((Math.floor(elapsedSec * 16) + s * 14) % 36);
      const smokeX = x + 76 + s * 12 + Math.round(Math.sin(elapsedSec * 2 + s) * 4);
      ctx.fillStyle = 'rgba(235, 225, 210, 0.22)';
      ctx.fillRect(smokeX, smokeY, 8, 6);
    }
  } else if (kind === 'shelf') {
    // Tall Carved Stardew-style Oak Bookshelf of Musical Legends
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 38, w + 4, h + 40);
    ctx.fillStyle = '#4f2d17';
    ctx.fillRect(x, y - 36, w, h + 36);
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(x + 4, y - 32, w - 8, h + 28);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 4, y - 34, w - 8, 3);

    const bookColors = [
      '#82243a',
      '#d9a738',
      '#2e6b3e',
      '#294a75',
      '#b85d19',
      '#faf5e8',
      '#6a3254',
    ];
    for (let row = 0; row < 3; row++) {
      const sy = y - 24 + row * 24;
      ctx.fillStyle = '#211007';
      ctx.fillRect(x + 10, sy, w - 20, 18);
      // Shelf plank
      ctx.fillStyle = '#7c4a28';
      ctx.fillRect(x + 8, sy + 18, w - 16, 4);
      for (let bx = x + 14; bx < x + w - 22; bx += 13) {
        const bCol = bookColors[(bx + row * 3) % bookColors.length];
        ctx.fillStyle = bCol;
        ctx.fillRect(bx, sy + 2, 10, 16);
        ctx.fillStyle = GOLD_LIGHT;
        ctx.fillRect(bx + 2, sy + 5, 6, 2);
        ctx.fillRect(bx + 2, sy + 13, 6, 1);
      }
    }
  } else if (kind === 'counter') {
    // Barnaby's Paneled Honey-Oak Tavern Counter, Collectible Lectern & Tankards
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    // Counter front paneled facade
    ctx.fillStyle = '#472814';
    ctx.fillRect(x, y + 28, w, h - 28);
    for (let px = x + 10; px < x + w - 24; px += 38) {
      ctx.fillStyle = '#331a0c';
      ctx.fillRect(px, y + 34, 30, h - 40);
      ctx.fillStyle = '#5c351b';
      ctx.fillRect(px + 2, y + 36, 26, h - 44);
    }
    // Polished honey-oak countertop in 3/4 view
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(x + 2, y + 2, w - 4, 28);
    ctx.fillStyle = '#87522f';
    ctx.fillRect(x + 4, y + 4, w - 8, 6);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, w - 8, 26);

    // Illuminated Collectible Card Book on Left Counter Lectern
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 12, y, 42, 26);
    ctx.fillStyle = '#6b1d2f';
    ctx.fillRect(x + 14, y + 2, 38, 22);
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(x + 17, y + 5, 14, 16);
    ctx.fillRect(x + 33, y + 5, 14, 16);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 31, y + 4, 2, 18);
    ctx.fillRect(x + 20, y + 9, 8, 6);
    ctx.fillStyle = '#6b1d2f';
    ctx.fillRect(x + 36, y + 9, 8, 2);
    ctx.fillRect(x + 36, y + 13, 8, 2);

    // Mead Keg on Counter Center-Right
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 106, y - 4, 26, 22);
    ctx.fillStyle = '#5c351b';
    ctx.fillRect(x + 108, y - 2, 22, 18);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 112, y - 2, 3, 18);
    ctx.fillRect(x + 123, y - 2, 3, 18);

    // Emerald Wine Bottle & Frothy Ale Mugs on Right Counter
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 147, y + 1, 10, 20);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x + 148, y + 2, 8, 18);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 150, y - 1, 4, 4);

    const mugOffsets = [172, 196];
    for (const mx of mugOffsets) {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x + mx - 1, y + 5, 16, 18);
      ctx.fillStyle = '#6e4022';
      ctx.fillRect(x + mx, y + 8, 14, 14);
      ctx.fillStyle = GOLD;
      ctx.fillRect(x + mx, y + 13, 14, 2);
      ctx.fillStyle = '#faf5e8';
      ctx.fillRect(x + mx, y + 5, 14, 4);
    }
  } else if (kind === 'stage') {
    // Musical Instruments on Stage (Sheet Music Atril, Golden Concert Harp, Lute & Drum)
    // 1) Sheet Music Stand (Atril)
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 18, y + 10, 44, 46);
    ctx.fillStyle = '#4f2d17';
    ctx.fillRect(x + 20, y + 12, 40, 42);
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(x + 24, y + 15, 32, 20);
    ctx.fillStyle = '#2b160c';
    ctx.fillRect(x + 27, y + 20, 12, 2);
    ctx.fillRect(x + 41, y + 20, 12, 2);
    ctx.fillRect(x + 27, y + 26, 12, 2);
    ctx.fillRect(x + 41, y + 26, 12, 2);

    // 2) Ornate Golden Concert Harp
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 86, y + 2, 40, 56);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 88, y + 4, 8, 52);
    ctx.fillRect(x + 88, y + 4, 34, 8);
    ctx.fillRect(x + 88, y + 48, 36, 8);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 90, y + 6, 30, 3);
    ctx.fillStyle = '#faf5e8';
    for (let s = 0; s < 5; s++) {
      ctx.fillRect(x + 98 + s * 5, y + 12, 1, 36);
    }

    // 3) Lute on Velvet Stand & Tavern Percussion Drum
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 148, y + 16, 34, 40);
    ctx.fillStyle = '#c8641e';
    ctx.fillRect(x + 150, y + 18, 30, 36);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 160, y + 30, 10, 10);
    ctx.fillStyle = '#472816';
    ctx.fillRect(x + 161, y, 8, 20);
  } else if (kind === 'notice_board') {
    // Carved Wooden Notice Board with Pinned Scrolls & Crimson Wax Seals
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 22, w + 4, h + 24);
    ctx.fillStyle = '#472814';
    ctx.fillRect(x, y - 20, w, h + 20);
    ctx.fillStyle = '#734424';
    ctx.fillRect(x + 4, y - 16, w - 8, h + 12);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 2, y - 18, w - 4, 3);

    // Pinned Parchment Scrolls
    const scrolls = [
      { sx: x + 8, sy: y - 10, sw: 16, sh: 22 },
      { sx: x + 28, sy: y - 4, sw: 16, sh: 20 },
      { sx: x + 12, sy: y + 20, sw: 22, sh: 24 },
    ];
    for (const sc of scrolls) {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(sc.sx - 1, sc.sy - 1, sc.sw + 2, sc.sh + 2);
      ctx.fillStyle = '#f3e6cf';
      ctx.fillRect(sc.sx, sc.sy, sc.sw, sc.sh);
      ctx.fillStyle = '#82243a'; // Wax seal
      ctx.fillRect(sc.sx + 5, sc.sy + 2, 5, 5);
      ctx.fillStyle = '#5c351b';
      ctx.fillRect(sc.sx + 3, sc.sy + 10, sc.sw - 6, 2);
      ctx.fillRect(sc.sx + 3, sc.sy + 15, sc.sw - 6, 2);
    }
  } else if (kind === 'table_round' || kind === 'table_rect') {
    // Turned Oak Table Legs
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 8, y + h - 22, 16, 22);
    ctx.fillRect(x + w - 24, y + h - 22, 16, 22);
    ctx.fillStyle = '#3d2110';
    ctx.fillRect(x + 10, y + h - 20, 12, 20);
    ctx.fillRect(x + w - 22, y + h - 20, 12, 20);

    // 3/4-View Honey-Oak Tabletop with Bevel & Crimson Embroidered Runner
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 2, w + 4, h - 8);
    // Front table edge thickness
    ctx.fillStyle = '#472814';
    ctx.fillRect(x, y + h - 18, w, 8);
    // Main honey-oak surface
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(x, y, w, h - 16);
    ctx.fillStyle = '#85502d';
    ctx.fillRect(x + 4, y + 3, w - 8, h - 22);

    // Embroidered Table Runner
    const runnerX = x + Math.floor(w * 0.26);
    const runnerW = Math.floor(w * 0.48);
    ctx.fillStyle = '#6b1d2f';
    ctx.fillRect(runnerX, y + 2, runnerW, h - 16);
    ctx.fillStyle = GOLD;
    ctx.fillRect(runnerX + 3, y + 2, 2, h - 16);
    ctx.fillRect(runnerX + runnerW - 5, y + 2, 2, h - 16);

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 24);

    // Flickering Table Candle with Warm Radial Glow, Frothy Mugs, Wine Bottle & Bread Plate
    const cx = x + Math.floor(w / 2);
    const cy = y + Math.floor((h - 16) / 2);

    const candleGlow = ctx.createRadialGradient(cx, cy - 8, 2, cx, cy - 8, 52);
    candleGlow.addColorStop(0, 'rgba(255, 205, 90, 0.34)');
    candleGlow.addColorStop(1, 'rgba(255, 160, 40, 0)');
    ctx.fillStyle = candleGlow;
    ctx.fillRect(cx - 52, cy - 60, 104, 104);

    // Brass Candleholder & Flame
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - 6, cy + 1, 12, 6);
    ctx.fillStyle = GOLD;
    ctx.fillRect(cx - 5, cy + 2, 10, 4);
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(cx - 3, cy - 8, 6, 10);
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(cx - 2, cy - 13 - (Math.floor(elapsedSec * 8) % 2), 4, 5);
    ctx.fillStyle = '#fff59d';
    ctx.fillRect(cx - 1, cy - 11 - (Math.floor(elapsedSec * 8) % 2), 2, 3);

    // Left Frothy Tankard
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 17, cy - 7, 13, 16);
    ctx.fillStyle = '#5c351b';
    ctx.fillRect(x + 18, cy - 4, 11, 12);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 18, cy + 1, 11, 2);
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(x + 18, cy - 6, 11, 3);

    // Plate with Artisan Bread / Cheese on Banquet Table
    if (kind === 'table_rect') {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(cx - 36, cy + 2, 18, 11);
      ctx.fillStyle = '#e8d8b9';
      ctx.fillRect(cx - 35, cy + 3, 16, 9);
      ctx.fillStyle = '#d9822b';
      ctx.fillRect(cx - 32, cy + 4, 10, 6);
    }

    // Right Emerald Wine Bottle & Goblet
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + w - 31, cy - 12, 9, 19);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x + w - 30, cy - 10, 7, 16);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + w - 29, cy - 13, 5, 3);
  } else if (kind === 'shop') {
    // Merchant Stall / Empório Musical in South-East Alcove with Striped Awning
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#4f2d17';
    ctx.fillRect(x, y, w, h);
    // Striped Burgundy & Gold Merchant Canopy Valance
    for (let sx = x + 4; sx < x + w - 8; sx += 12) {
      ctx.fillStyle = ((sx - x) / 12) % 2 === 0 ? '#6b1d2f' : '#d9a738';
      ctx.fillRect(sx, y + 3, 12, 16);
    }
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    // Ornate Treasure Chest & Golden Lute Relic
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 12, y + 22, 28, 20);
    ctx.fillStyle = '#6e4022';
    ctx.fillRect(x + 14, y + 24, 24, 16);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.fillRect(x + 23, y + 29, 6, 6);

    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x + 54, y + 20, 24, 24);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 56, y + 22, 20, 20);
    ctx.fillStyle = '#24130b';
    ctx.fillRect(x + 62, y + 28, 8, 8);
  } else if (kind === 'pillar') {
    // Carved Oak Timber Column with Brass Bands
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 2, y - 78, w + 4, h + 80);
    ctx.fillStyle = '#3d2110';
    ctx.fillRect(x, y - 76, w, h + 76);
    ctx.fillStyle = '#5c351b';
    ctx.fillRect(x + 4, y - 72, w - 8, h + 68);
    ctx.fillStyle = '#754526';
    ctx.fillRect(x + 6, y - 72, 6, h + 68);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 2, y - 20, w - 4, 5);
    ctx.fillRect(x - 2, y + h - 8, w + 4, 8);
  }
}

