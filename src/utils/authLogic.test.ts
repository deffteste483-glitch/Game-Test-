import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_TRAVELERS,
  validateLoginInput,
  authenticateTraveler,
  registerNewTraveler,
  recoverTravelerPassword,
  createVisitorSession,
  clampVolume,
} from './authLogic';

test('validateLoginInput rejects empty username or password', () => {
  const emptyUser = validateLoginInput('   ', 'secret123');
  assert.equal(emptyUser.valid, false);
  assert.equal(emptyUser.field, 'username');

  const emptyPass = validateLoginInput('Aldous_Vane', '');
  assert.equal(emptyPass.valid, false);
  assert.equal(emptyPass.field, 'password');
});

test('authenticateTraveler authenticates valid seeded traveler and rejects wrong password', () => {
  const ok = authenticateTraveler(INITIAL_TRAVELERS, 'Aldous_Vane', 'alaude16');
  assert.equal(ok.success, true);
  assert.equal(ok.account?.username, 'Aldous_Vane');

  const wrong = authenticateTraveler(INITIAL_TRAVELERS, 'Aldous_Vane', 'errada');
  assert.equal(wrong.success, false);
});

test('registerNewTraveler creates a new account and prevents duplicates', () => {
  const res = registerNewTraveler(
    INITIAL_TRAVELERS,
    'Miriam_Cantora',
    'miriam@taverna.com',
    'melodia99',
    'Jazz, Blues & Soul'
  );
  assert.equal(res.success, true);
  assert.equal(res.account?.entryNumber, 144);
  assert.equal(res.updatedAccounts?.length, 3);

  const duplicate = registerNewTraveler(
    res.updatedAccounts!,
    'Miriam_Cantora',
    'outro@taverna.com',
    'melodia99',
    'Jazz, Blues & Soul'
  );
  assert.equal(duplicate.success, false);
});

test('recoverTravelerPassword locates existing traveler and returns hint', () => {
  const rec = recoverTravelerPassword(INITIAL_TRAVELERS, 'helena@tavernamusical.com');
  assert.equal(rec.success, true);
  assert.equal(rec.recoveredUsername, 'Helena_Lyra');
  assert.ok(rec.hint && rec.hint.includes('noturno7'));
});

test('createVisitorSession and clampVolume return deterministic values', () => {
  const visitor = createVisitorSession(2);
  assert.equal(visitor.isVisitor, true);
  assert.equal(visitor.entryNumber, 143);

  assert.equal(clampVolume(135), 100);
  assert.equal(clampVolume(-15), 0);
  assert.equal(clampVolume(64.6), 65);
});

import {
  sanitizeAdventurerAppearance,
  generateRandomAdventurer,
  stepCharacterPosition,
  SKIN_TONE_OPTIONS,
} from './characterLogic';

test('sanitizeAdventurerAppearance preserves valid fields and replaces invalid ones with defaults', () => {
  const sanitized = sanitizeAdventurerAppearance(
    {
      adventurerName: '  Lyra das Cordas  ',
      skinTone: 'ebony',
      hairStyle: 'braids',
      // @ts-expect-error testing invalid fallback
      outfit: 'cyber_suit_invalid',
    },
    'Padrao'
  );
  assert.equal(sanitized.adventurerName, 'Lyra das Cordas');
  assert.equal(sanitized.skinTone, 'ebony');
  assert.equal(sanitized.hairStyle, 'braids');
  assert.equal(sanitized.outfit, 'bard_tunic');
});

test('generateRandomAdventurer produces valid option IDs across all categories', () => {
  const rand = generateRandomAdventurer('Trovador');
  assert.equal(rand.adventurerName, 'Trovador');
  assert.ok(SKIN_TONE_OPTIONS.some((o) => o.id === rand.skinTone));
});

test('stepCharacterPosition moves character toward target and clamps within tavern bounds', () => {
  const step1 = stepCharacterPosition(20, 70, 50, 70, 20, 0.5);
  assert.equal(step1.x, 30);
  assert.equal(step1.arrived, false);
  assert.equal(step1.facing, 'right');

  const step2 = stepCharacterPosition(49.5, 70, 50, 70, 20, 0.5);
  assert.equal(step2.x, 50);
  assert.equal(step2.arrived, true);
});

import {
  INITIAL_PLAYER_STATE,
  TAVERN_INTERACTIVE_STATIONS,
  TAVERN_NPCS,
  TAVERN_OBSTACLES,
  TAVERN_SEAT_STOOLS,
  findNearestInteractable,
  findPathAStar,
  getNpcRuntimeState,
  isWorldPointWalkable,
  sortRenderablesByDepth,
  stepCameraLerp,
  stepFreeMovementPhysics,
  vectorToDirection8,
} from './tavernWorldLogic';

test('vectorToDirection8 and stepFreeMovementPhysics handle 8-directional acceleration and deceleration', () => {
  assert.equal(vectorToDirection8(1, 0), 'E');
  assert.equal(vectorToDirection8(1, -1), 'NE');
  assert.equal(vectorToDirection8(0, -1), 'N');
  assert.equal(vectorToDirection8(-1, 1), 'SW');

  // Accelerate north-east
  const moving = stepFreeMovementPhysics(INITIAL_PLAYER_STATE, 1, -1, TAVERN_OBSTACLES, 0.08);
  assert.equal(moving.isMoving, true);
  assert.equal(moving.dir8, 'NE');
  assert.equal(moving.facing, 'right');
  assert.equal(moving.vertical, 'back');
  assert.ok(moving.vx > 0 && moving.vy < 0);

  // Decelerate to rest when input is released
  let decel = moving;
  for (let i = 0; i < 10; i++) {
    decel = stepFreeMovementPhysics(decel, 0, 0, TAVERN_OBSTACLES, 0.05);
  }
  assert.equal(decel.isMoving, false);
  assert.equal(decel.vx, 0);
  assert.equal(decel.vy, 0);
});

test('findPathAStar routes around solid tavern tables without passing through obstacles', () => {
  // Central banquet table is at x: 476..676, y: 356..442
  assert.equal(isWorldPointWalkable(576, 396, TAVERN_OBSTACLES), false);

  // Path from south of the banquet table (576, 480) to north of it (576, 296)
  const path = findPathAStar(576, 480, 576, 296, TAVERN_OBSTACLES);
  assert.ok(path.length > 2, 'A* should find a multi-waypoint path around the table');

  for (const wp of path) {
    assert.equal(
      isWorldPointWalkable(wp.x, wp.y, TAVERN_OBSTACLES, 12),
      true,
      `Waypoint (${wp.x}, ${wp.y}) must be walkable and outside obstacles`
    );
  }
});

test('findNearestInteractable detects all 9 tavern stations within proximity', () => {
  assert.equal(TAVERN_INTERACTIVE_STATIONS.length, 9);
  for (const st of TAVERN_INTERACTIVE_STATIONS) {
    const res = findNearestInteractable(st.interactX, st.interactY, TAVERN_INTERACTIVE_STATIONS);
    assert.ok(res);
    assert.equal(res.station.id, st.id);
    assert.equal(res.inRange, true);
  }
});

test('getNpcRuntimeState computes varied NPC activities, proximity greetings, and walkable stools', () => {
  assert.ok(TAVERN_NPCS.length >= 7);
  const barnaby = TAVERN_NPCS[0];
  const farState = getNpcRuntimeState(barnaby, 2.0, 100, 500);
  assert.equal(farState.isPlayerNear, false);
  assert.notEqual(farState.activity, 'greeting_player');

  const nearState = getNpcRuntimeState(barnaby, 2.0, barnaby.x, barnaby.y + 40);
  assert.equal(nearState.isPlayerNear, true);
  assert.equal(nearState.activity, 'greeting_player');
  assert.equal(nearState.activeSpeech, barnaby.greetingLine);

  // Verify strolling NPC (Elena) transitions between pause and walking states over time
  const elena = TAVERN_NPCS.find((n) => n.id === 'npc_elena');
  assert.ok(elena, 'Strolling NPC Elena must exist in TAVERN_NPCS');
  const elenaT0 = getNpcRuntimeState(elena!, 0.0, 100, 100);
  const elenaT3 = getNpcRuntimeState(elena!, 3.5, 100, 100);
  assert.notEqual(
    `${Math.round(elenaT0.x)},${Math.round(elenaT0.y)}`,
    `${Math.round(elenaT3.x)},${Math.round(elenaT3.y)}`,
    'Strolling NPC must move across the hall over time'
  );

  for (const stool of TAVERN_SEAT_STOOLS) {
    assert.equal(
      isWorldPointWalkable(stool.x, stool.y, TAVERN_OBSTACLES, 10),
      true,
      `Stool ${stool.id} at (${stool.x}, ${stool.y}) must be walkable`
    );
  }
});

test('stepCameraLerp clamps to world bounds and sortRenderablesByDepth sorts by Y', () => {
  const cam = stepCameraLerp(0, 0, 50, 50, 960, 460, 0.1, 10);
  assert.equal(cam.camX, 0);
  assert.equal(cam.camY, 0);

  const sorted = sortRenderablesByDepth([
    { id: 'front', depthY: 600 },
    { id: 'back', depthY: 210 },
    { id: 'mid', depthY: 400 },
  ]);
  assert.deepEqual(
    sorted.map((s) => s.id),
    ['back', 'mid', 'front']
  );
});

import {
  INITIAL_BARD_NOTES,
  createBardNote,
  endorseBardNote,
  filterBardNotes,
} from './noticeBoardLogic';

test('filterBardNotes and endorseBardNote filter by category and increment applause', () => {
  const all = filterBardNotes(INITIAL_BARD_NOTES, 'todas');
  assert.equal(all.length, INITIAL_BARD_NOTES.length);

  const desafios = filterBardNotes(INITIAL_BARD_NOTES, 'desafios');
  assert.ok(desafios.length >= 2);
  assert.ok(desafios.every((n) => n.category === 'desafios'));

  const targetId = INITIAL_BARD_NOTES[0].id;
  const beforeCount = INITIAL_BARD_NOTES[0].applauseCount;
  const endorsed = endorseBardNote(INITIAL_BARD_NOTES, targetId);
  assert.equal(endorsed[0].applauseCount, beforeCount + 1);
});

test('createBardNote validates input and prepends new scroll note to the board', () => {
  const invalid = createBardNote(INITIAL_BARD_NOTES, 'Aldous_Vane', 'Oi', 'Curto', '');
  assert.equal(invalid.success, false);

  const valid = createBardNote(
    INITIAL_BARD_NOTES,
    'Aldous_Vane',
    'Canção da Lareira Dourada',
    'Um novo verso escrito junto às chamas para celebrar a harmonia da taverna.',
    'Acorde de Sol Maior (4/4)',
    'baladas'
  );
  assert.equal(valid.success, true);
  assert.equal(valid.newNote?.title, 'Canção da Lareira Dourada');
  assert.equal(valid.updatedNotes?.length, INITIAL_BARD_NOTES.length + 1);
});

import {
  MAX_QUIZ_PLAYERS,
  QUIZ_ARTISTS_DB,
  TAVERN_BOT_COMPANIONS,
  createQuizMatch,
  isGuessMatchingArtist,
  loadPlayerProgression,
  recordQuizResultForPlayer,
  revealNextHintForPlayer,
  submitPlayerGuess,
} from './quizCatalogAndLogic';

test('createQuizMatch supports up to 8 players receiving the same real-life artist while keeping hints and attempts strictly independent', () => {
  const match = createQuizMatch({
    mode: 'multiplayer',
    tableName: 'Mesa Principal das Banquetas',
    hostPlayer: { id: 'host_1', name: 'Aldous_Vane' },
    additionalPlayers: TAVERN_BOT_COMPANIONS.map((b) => ({
      id: b.id,
      name: b.name,
      isBot: true,
      color: b.color,
    })),
    targetArtistId: 'artist_mateo',
  });

  assert.equal(match.players.length, MAX_QUIZ_PLAYERS);
  assert.equal(match.targetArtistId, 'artist_mateo');
  assert.ok(match.players.every((p) => p.hintsRevealed === 1 && p.attemptsUsed === 0));

  // Player 1 reveals 2 extra hints (reaching 3 hints)
  let afterHints = revealNextHintForPlayer(match, 'host_1');
  afterHints = revealNextHintForPlayer(afterHints, 'host_1');
  assert.equal(afterHints.players[0].hintsRevealed, 3);
  // Every other player (seats 2..8) MUST still be at 1 hint
  for (let i = 1; i < MAX_QUIZ_PLAYERS; i++) {
    assert.equal(
      afterHints.players[i].hintsRevealed,
      1,
      `Seat ${i} hintsRevealed must remain independent`
    );
  }

  // Player 1 submits a wrong guess on Turn 1 -> attemptsUsed becomes 1 for Player 1, turn advances to Player 2
  const afterWrongGuess = submitPlayerGuess(afterHints, 'host_1', 'Palpite Incorreto');
  assert.equal(afterWrongGuess.players[0].attemptsUsed, 1);
  assert.equal(afterWrongGuess.players[0].status, 'playing');
  assert.equal(afterWrongGuess.currentTurnIndex, 1);
  for (let i = 1; i < MAX_QUIZ_PLAYERS; i++) {
    assert.equal(
      afterWrongGuess.players[i].attemptsUsed,
      0,
      `Seat ${i} attemptsUsed must remain 0`
    );
  }

  // Player 2 guesses the right real-life artist ("Raul Seixas") on their turn -> solves with 1 hint and 0 prior attempts (1000 pts)
  const afterPlayer2Solve = submitPlayerGuess(
    afterWrongGuess,
    afterWrongGuess.players[1].playerId,
    'Raul Seixas'
  );
  assert.equal(afterPlayer2Solve.players[1].status, 'solved');
  assert.equal(afterPlayer2Solve.players[1].scoreEarned, 1000);
  assert.equal(afterPlayer2Solve.currentTurnIndex, 2);
});

test('QUIZ_ARTISTS_DB contains real-life musical artists/bands and matches artist names, bands, and aliases', () => {
  assert.ok(QUIZ_ARTISTS_DB.length >= 12);
  const freddie = QUIZ_ARTISTS_DB.find((a) => a.name === 'Freddie Mercury');
  assert.ok(freddie, 'Freddie Mercury must be in QUIZ_ARTISTS_DB');
  assert.equal(isGuessMatchingArtist('Freddie Mercury', freddie!), true);
  assert.equal(isGuessMatchingArtist('Queen', freddie!), true);

  const rita = QUIZ_ARTISTS_DB.find((a) => a.name === 'Rita Lee');
  assert.ok(rita, 'Rita Lee must be in QUIZ_ARTISTS_DB');
  assert.equal(isGuessMatchingArtist('Rita Lee', rita!), true);
  assert.equal(isGuessMatchingArtist('Os Mutantes', rita!), true);

  const initialProg = loadPlayerProgression('test_traveler_99');
  assert.equal(initialProg.unlockedArtistIds.includes('artist_celeste'), false);

  const updated = recordQuizResultForPlayer(
    initialProg,
    'artist_celeste',
    true,
    860
  );
  assert.equal(updated.unlockedArtistIds.includes('artist_celeste'), true);
  assert.equal(updated.stats.matchesPlayed, 1);
  assert.equal(updated.stats.matchesWon, 1);
  assert.equal(updated.stats.totalScore, 860);
});

