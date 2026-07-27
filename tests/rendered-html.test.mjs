import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://tetstar.example/", {
      headers: {
        accept: "text/html",
        host: "tetstar.example",
        "x-forwarded-host": "tetstar.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete game selector", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /TETSTAR/);
  assert.match(html, /40L/);
  assert.match(html, />LINES</);
  assert.match(html, /BLITZ/);
  assert.match(html, /ZEN/);
  assert.match(html, /SINGLEPLAYER/);
  assert.match(html, /MULTIPLAYER/);
  assert.match(html, /2–8 PLAYERS/);
  assert.match(html, /RULE LAB/);
  assert.match(html, /7-BAG · 7종 균등/);
  assert.match(html, /GARBAGE · 공격 방해줄/);
  assert.ok(
    html.indexOf("게임 모드") < html.indexOf("STACK FAST"),
    "mode selection should render before the promotional hero",
  );
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview/);
});

test("ships without starter-only assets", async () => {
  const [
    packageJson,
    gameClient,
    globalCss,
    authGate,
    profileDashboard,
    migration,
    writeLockMigration,
    directoryGrantMigration,
    socialMigration,
    personalBestMigration,
    headToHeadMigration,
    usernameAuth,
    icon,
  ] =
    await Promise.all([
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../app/GameClient.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../app/AuthGate.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../app/ProfileDashboard.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260723153000_accounts.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260723162000_lock_profile_and_record_writes.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260724002500_allow_username_auth_directory_read.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260724033000_records_friends_leaderboards.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260724060000_personal_best_result.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/migrations/20260727120000_head_to_head_records.sql",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL(
          "../supabase/functions/username-auth/index.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../app/icon.svg", import.meta.url), "utf8"),
    ]);

  assert.match(packageJson, /"name": "tetstar"/);
  assert.match(packageJson, /"peerjs":/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(gameClient, /playersRef\.current\.length >= 8/);
  assert.match(gameClient, /src=\{`\$\{GAME_ASSET_BASE_PATH\}icon\.svg`\}/);
  assert.match(gameClient, /import Image from "next\/image"/);
  assert.match(gameClient, /reason: "ROOM_FULL"/);
  assert.match(gameClient, /peer\.connect\(roomPeerId\(code\)/);
  assert.match(gameClient, /searchParams\.set\("room", roomCode\)/);
  assert.match(gameClient, /COPY INVITE LINK/);
  assert.match(gameClient, /type: "chat-submit"/);
  assert.match(gameClient, /PARTY CHAT/);
  assert.match(gameClient, /screen === "versus" && !multiplayerPlaying/);
  assert.match(gameClient, /nextScreen !== "versus"/);
  assert.match(gameClient, /submit_game_result/);
  assert.match(gameClient, /NEW PERSONAL BEST/);
  assert.match(gameClient, /inputBlockedUntilRef/);
  assert.match(
    gameClient,
    /action === "down" \|\|\s*action === "hardDrop"/,
  );
  assert.match(gameClient, /clearRepeatHandles/);
  assert.match(gameClient, /RETRY JOIN/);
  assert.match(gameClient, /MULTIPLAYER INVITE/);
  assert.match(gameClient, /PLAYING AS/);
  assert.doesNotMatch(gameClient, /className="online-name-field"/);
  assert.doesNotMatch(gameClient, /setPlayerName/);
  assert.match(gameClient, /connectionTimeoutRef/);
  assert.match(gameClient, /retryCount < 1/);
  assert.match(gameClient, /자동으로 한 번 더 시도/);
  assert.match(gameClient, /if \(connection\.open\) registerConnection\(\)/);
  assert.match(gameClient, /tetstar-room-\$\{code\.toLowerCase\(\)\}/);
  assert.match(gameClient, /type: "join-request"/);
  assert.match(gameClient, /type: "host-transfer"/);
  assert.match(gameClient, /scheduleRealtimePresenceLeave/);
  assert.match(gameClient, /finalizeRealtimePresenceLeave/);
  assert.match(gameClient, /phaseRef\.current === "lobby" \? 20000 : 8000/);
  assert.match(gameClient, /let subscribedOnce = false/);
  assert.match(gameClient, /player\.id === hostId/);
  assert.match(gameClient, /type: "attack-log"/);
  assert.match(gameClient, /targetMode: "cycle"/);
  assert.match(gameClient, /type: "target-select"/);
  assert.match(gameClient, /type: "item-use"/);
  assert.match(gameClient, /type: "item-effect"/);
  assert.match(gameClient, /type: "item-state"/);
  assert.match(gameClient, /type ItemType = "ink" \| "speed" \| "odd" \| "spin" \| "star"/);
  assert.match(gameClient, /itemMode: "stock" \| "blocks"/);
  assert.match(gameClient, /itemCounts: Record<ItemType, number>/);
  assert.match(gameClient, /function itemCountFor/);
  assert.match(gameClient, /enabledItems\(rules\)\.flatMap/);
  assert.doesNotMatch(gameClient, /itemLimit/);
  assert.match(gameClient, /SPEED_EFFECT_MS = 7000/);
  assert.match(gameClient, /SPIN_EFFECT_MS = 5000/);
  assert.match(gameClient, /function createSeededRandom/);
  assert.match(gameClient, /pieceSeed=\{matchId\}/);
  assert.match(gameClient, /nextQueue\(queue, pieceRandomRef\.current\)/);
  assert.match(
    gameClient,
    /startingItemInventory\(packet\.rules, packet\.matchId\)/,
  );
  assert.match(
    gameClient,
    /setQueue\(\(current\) => \["W" as PieceName, \.\.\.current\]\)/,
  );
  assert.match(gameClient, /function starHoleCells/);
  assert.match(gameClient, /ITEM BLOCKS/);
  assert.match(gameClient, /onItemPickup/);
  assert.match(gameClient, /W: \[/);
  assert.match(gameClient, /className="ink-overlay"/);
  assert.match(gameClient, /joiningAsSpectator/);
  assert.match(gameClient, /다음 경기부터 참가합니다/);
  assert.match(gameClient, /screen-multiplayer-playing/);
  assert.match(gameClient, /mobile-inventory-fire/);
  assert.doesNotMatch(gameClient, /mobile-item-action/);
  assert.match(gameClient, /selectedItemTarget/);
  assert.match(
    gameClient,
    /\(!matchRules\.itemsEnabled &&\s*matchRules\.targetMode !== "manual"\)/,
  );
  assert.match(gameClient, /selectInventoryItem/);
  assert.match(gameClient, /event\.code === "KeyQ"/);
  assert.match(gameClient, /aria-pressed=\{currentItem === item\}/);
  assert.match(gameClient, /에게 \$\{ITEM_META\[currentItem\]\.label\} 아이템 사용/);
  assert.match(gameClient, /type: "lobby"/);
  assert.match(gameClient, /RETURN TO LOBBY/);
  assert.match(gameClient, /Numpad/);
  assert.match(gameClient, /event\.code !== "KeyE"/);
  assert.doesNotMatch(gameClient, /event\.code !== "KeyI"/);
  assert.match(gameClient, /repeatHandles\.current\.get\(token\) !== handle/);
  assert.match(
    gameClient,
    /if \(repeat\) \{\s*event\.currentTarget\.setPointerCapture/,
  );
  assert.match(
    gameClient,
    /const startJoystick[\s\S]*stopAllRepeats\(\);[\s\S]*joystickDirection\.current = null/,
  );
  assert.match(gameClient, /className="remote-player-hotkey"/);
  assert.doesNotMatch(gameClient, /P\{player\.slot \+ 1\}/);
  assert.match(gameClient, /type: "ink-state"/);
  assert.match(gameClient, /remote-ink-overlay/);
  assert.match(gameClient, /focusChatWithEnter/);
  assert.match(gameClient, /inputRef\.current\?\.focus\(\)/);
  assert.match(gameClient, /log\.scrollTop = log\.scrollHeight/);
  assert.match(gameClient, /globalShortcut = true/);
  assert.match(gameClient, /className="mobile-match-chat"/);
  assert.match(gameClient, /const isLateJoinSpectator/);
  assert.match(
    gameClient,
    /isSpectating && !isLateJoinSpectator \? "online-eliminated"/,
  );
  assert.match(
    gameClient,
    /matchRules\.itemsEnabled && !isLateJoinSpectator/,
  );
  assert.doesNotMatch(
    gameClient,
    /isSpectating && phase !== "ended"\s*\?\s*"preserved-local-board preserved-local-board-hidden"/,
  );
  assert.match(gameClient, /window\.visualViewport/);
  assert.match(gameClient, /--visual-viewport-height/);
  assert.match(gameClient, /onlineArenaRef/);
  assert.match(gameClient, /new ResizeObserver\(updateBoardSpace\)/);
  assert.match(gameClient, /controlsTop - arenaTop - 18/);
  assert.match(gameClient, /블록 왼쪽으로 한 칸 이동/);
  assert.match(gameClient, /블록 오른쪽으로 한 칸 이동/);
  assert.match(gameClient, /setInkSignal\(\{ id: 0 \}\)/);
  assert.match(gameClient, /className="match-result-layer"/);
  assert.match(gameClient, /eliminatedAt\?: number/);
  assert.match(gameClient, /const eliminationDifference/);
  assert.match(gameClient, /formatResultTime/);
  assert.match(gameClient, /aria-label="최종 순위"/);
  assert.match(gameClient, />RESULTS</);
  assert.match(gameClient, /NO\. 1 · WINNER/);
  assert.match(gameClient, /matchEndedAt - matchStartedAt/);
  assert.match(
    gameClient,
    /available === false[\s\S]*removeItem\("tetstar-identity-v1"\)/,
  );
  assert.match(gameClient, /className=\{`winner-reveal/);
  assert.match(gameClient, /showResultCard/);
  assert.match(gameClient, /공격 블록이 한계선을 넘어 탈락했습니다/);
  assert.match(gameClient, /matchOutcome/);
  assert.match(gameClient, /개인 모바일 조작/);
  assert.match(gameClient, /changeMobileControlLayout/);
  assert.match(gameClient, /controlLayoutStorage/);
  assert.match(gameClient, /MATCH COMPLETE/);
  assert.match(gameClient, /HORIZONTAL_DAS_MS = 140/);
  assert.match(gameClient, /HORIZONTAL_ARR_MS = 54/);
  assert.match(gameClient, /JOYSTICK_HORIZONTAL_DAS_MS = 165/);
  assert.match(gameClient, /JOYSTICK_HORIZONTAL_ARR_MS = 66/);
  assert.match(gameClient, /JOYSTICK_DEADZONE = 22/);
  assert.match(gameClient, /joystickInputOriginRef/);
  assert.match(gameClient, /joystickArmedAtRef/);
  assert.match(gameClient, /const touchOrigin/);
  assert.match(gameClient, /const visualOrigin/);
  assert.match(gameClient, /window\.performance\.now\(\) \+ 70/);
  assert.match(gameClient, /const BUFFER_ROWS = 3/);
  assert.match(gameClient, /const HIDDEN_SPAWN_ROWS = 4/);
  assert.match(gameClient, /const VISIBLE_HEIGHT = 20/);
  assert.match(gameClient, /const HEIGHT = VISIBLE_HEIGHT \+ BUFFER_ROWS/);
  assert.match(gameClient, /const RESCUE_LOCK_DELAY_MS = 700/);
  assert.match(gameClient, /const MAX_RESCUE_GROUNDED_MS = 2400/);
  assert.match(gameClient, /function samePiece\(left: Piece, right: Piece\)/);
  assert.match(gameClient, /const pieceGenerationRef = useRef\(0\)/);
  assert.match(
    gameClient,
    /expectedGeneration !== pieceGenerationRef\.current[\s\S]*!samePiece\(activeRef\.current, piece\)/,
  );
  assert.match(
    gameClient,
    /if \(!grounded\) \{\s*lockDeadlineRef\.current = null;\s*return;/,
  );
  assert.doesNotMatch(
    gameClient,
    /if \(!grounded\) \{[\s\S]{0,160}groundedLimitRef\.current = null/,
  );
  assert.doesNotMatch(
    gameClient,
    /const hardDrop = useCallback\(\(\) => \{\s*clearRepeatHandles\(\)/,
  );
  assert.match(
    gameClient,
    /const rescueActive = pieceCells\(active\)\.some\(\(\[, y\]\) => y < BUFFER_ROWS\)/,
  );
  assert.match(gameClient, /const DANGER_VISIBLE_ROWS = 7/);
  assert.match(gameClient, /VERSUS_SPEED_STEP_SECONDS = 20/);
  assert.match(gameClient, /VERSUS_SPEED_STEP_MS = 70/);
  assert.match(gameClient, /VERSUS_MIN_GRAVITY_MS = 70/);
  assert.match(gameClient, /MULTIPLAYER_DEFAULT_GRAVITY_MS = 720/);
  assert.match(gameClient, /GRAVITY_HEARTBEAT_MS = 32/);
  assert.match(gameClient, /stepDownRef\.current\(\)/);
  assert.doesNotMatch(
    gameClient,
    /\[active, lines, mode, rules\.gravity, seconds/,
  );
  assert.match(gameClient, /GARBAGE_QUEUE_DELAY_MS = 3500/);
  assert.match(gameClient, /MAX_GARBAGE_QUEUE = 40/);
  assert.doesNotMatch(
    gameClient,
    /for \(const offset of \[-1, 1, -2, 2, -3, 3\]\)/,
  );
  assert.doesNotMatch(gameClient, /enteringFromBuffer/);
  assert.match(
    gameClient,
    /\.slice\(0, BUFFER_ROWS \+ DANGER_VISIBLE_ROWS\)/,
  );
  assert.match(gameClient, /sharedStartAt=\{matchStartedAt\}/);
  assert.match(gameClient, /versusSpeedSteps \* VERSUS_SPEED_STEP_MS/);
  assert.match(gameClient, /Math\.floor\(\(Date\.now\(\) - sharedStartAt\) \/ 1000\)/);
  assert.match(gameClient, /visibleRendered/);
  assert.match(gameClient, /className=\{`buffer-zone/);
  assert.match(gameClient, /buffer-zone-danger/);
  assert.doesNotMatch(gameClient, /3 ROW BUFFER/);
  assert.match(gameClient, /\{ length: VISIBLE_HEIGHT \* WIDTH \}/);
  assert.match(gameClient, /const enqueueGarbage/);
  assert.match(gameClient, /const cancelPendingGarbage/);
  assert.match(gameClient, /function garbageHolePattern\(/);
  assert.match(gameClient, /comboChain >= 7/);
  assert.match(gameClient, /comboChain >= 5/);
  assert.match(gameClient, /comboChain >= 3/);
  assert.match(gameClient, /onAttack\?\.\(attack, nextCombo \+ 1\)/);
  assert.match(gameClient, /type: "attack"; amount: number; comboChain\?: number/);
  assert.match(gameClient, /type: "garbage"; id: number; amount: number; comboChain\?: number/);
  assert.match(gameClient, /\| \{ type: "kicked" \}/);
  assert.match(gameClient, /const kickPlayer = \(playerId: string\)/);
  assert.match(gameClient, /className="kick-player"/);
  assert.match(gameClient, /"RECONNECTING"/);
  assert.match(gameClient, /sendRealtimePacket\(\{ type: "leave" \}\)/);
  assert.match(
    gameClient,
    /itemsEnabled: false,\s*gravity: MULTIPLAYER_DEFAULT_GRAVITY_MS/,
  );
  assert.match(gameClient, /pendingGarbage=\{pendingGarbage\}/);
  assert.match(
    gameClient,
    /pendingGarbageDeadline=\{pendingGarbageDeadline\}/,
  );
  assert.match(gameClient, /className=\{`garbage-meter/);
  assert.match(gameClient, /className="combo-attack-effect"/);
  assert.match(
    gameClient,
    /navigator\.vibrate\?\.\(\[80, 50, 130, 70, 220\]\)/,
  );
  assert.match(gameClient, /className="death-effect"/);
  assert.match(gameClient, /새 블록이 들어올 공간이 없습니다/);
  assert.match(gameClient, /공격 블록이 한계선을 넘었습니다/);
  assert.match(gameClient, /winner-reveal-loss/);
  assert.match(gameClient, /className=\{`item-launch-effect/);
  assert.match(gameClient, /rules=\{\{ \.\.\.rules, itemsEnabled: false \}\}/);
  assert.match(gameClient, /garbageAppliedTotalRef/);
  assert.match(gameClient, /const liftedActive/);
  assert.match(gameClient, /const overflowedRows/);
  assert.doesNotMatch(gameClient, /activeOverflow/);
  assert.match(
    gameClient,
    /const applyTimer = window\.setTimeout\(\(\) => \{[\s\S]*garbageAppliedTotalRef\.current = garbage\.amount/,
  );
  assert.match(gameClient, /REALTIME READY/);
  assert.match(gameClient, /SUPABASE REALTIME/);
  assert.match(gameClient, /REALTIME_SNAPSHOT_UPLINK_MS = 400/);
  assert.match(gameClient, /REALTIME_SNAPSHOT_BATCH_MS = 600/);
  assert.match(gameClient, /tetstar-snapshot-\$\{code\.toLowerCase\(\)\}/);
  assert.match(gameClient, /broadcast: \{ ack: false \}/);
  assert.match(gameClient, /queueRealtimeSnapshot/);
  assert.match(gameClient, /sendRealtimePacket\(\{ type: "snapshots", snapshots \}\)/);
  assert.match(gameClient, /onSnapshotRef\.current = onSnapshot/);
  assert.match(gameClient, /snapshotIntervalMs - \(now - snapshotSentAt\.current\)/);
  assert.doesNotMatch(
    gameClient,
    /sendRealtimePacket\(\{ type: "snapshot", snapshot \}\)/,
  );
  assert.match(globalCss, /calc\(\(100dvh - 146px\) \/ 25\)/);
  assert.match(globalCss, /calc\(\(100dvh - 260px\) \/ 25\)/);
  assert.match(globalCss, /env\(safe-area-inset-bottom\)/);
  assert.match(globalCss, /\.mobile-opponent-strip/);
  assert.match(globalCss, /grid-template-areas: "hold board next"/);
  assert.match(globalCss, /\.match-result-card/);
  assert.match(globalCss, /\.result-title-row/);
  assert.match(globalCss, /\.result-rank/);
  assert.match(globalCss, /\.result-survival/);
  assert.match(globalCss, /\.winner-reveal/);
  assert.match(globalCss, /\.touch-direction/);
  assert.match(globalCss, /\.control-layout-options/);
  assert.match(globalCss, /\.buffer-zone/);
  assert.match(globalCss, /grid-template-rows: repeat\(3, var\(--cell\)\)/);
  assert.match(globalCss, /bottom: calc\(100% \+ 1px\)/);
  assert.match(globalCss, /position: absolute/);
  assert.match(globalCss, /padding-top: calc\(var\(--cell\) \* 3\)/);
  assert.match(globalCss, /margin-bottom: calc\(var\(--cell\) \* 2\)/);
  assert.match(globalCss, /\.garbage-meter/);
  assert.match(globalCss, /\.slot-reconnecting/);
  assert.match(globalCss, /\.kick-player/);
  assert.match(globalCss, /\.board-danger/);
  assert.match(globalCss, /\.board-topout/);
  assert.match(globalCss, /\.board-overlay-lost/);
  assert.match(globalCss, /\.winner-reveal-loss/);
  assert.match(globalCss, /brightness\(0\.72\)/);
  assert.match(globalCss, /@keyframes topout-board-hit/);
  assert.match(globalCss, /@keyframes topout-fragment/);
  assert.match(globalCss, /\.combo-attack-effect/);
  assert.match(globalCss, /\.item-launch-effect/);
  assert.match(globalCss, /\.buffer-zone-danger/);
  assert.match(globalCss, /grid-template-rows: repeat\(20, 1fr\)/);
  assert.match(globalCss, /\.matchup-list/);
  assert.match(
    globalCss,
    /\.opponents-grid \.remote-player:only-child[\s\S]*max-width: 180px/,
  );
  assert.match(globalCss, /\.rules-personal-control/);
  assert.match(globalCss, /\.rules-control-options/);
  assert.match(globalCss, /\.rules-item-settings/);
  assert.match(globalCss, /\.item-pool-settings/);
  assert.match(globalCss, /\.item-count-settings/);
  assert.match(globalCss, /\.inventory-item\.inventory-next/);
  assert.match(globalCss, /\.item-inventory/);
  assert.match(globalCss, /\.item-cell/);
  assert.match(globalCss, /\.board-item-status/);
  assert.match(globalCss, /\.mobile-inventory-fire/);
  assert.doesNotMatch(globalCss, /\.mobile-item-action/);
  assert.match(globalCss, /\.piece-W/);
  assert.match(globalCss, /\.touch-step/);
  assert.match(globalCss, /var\(--visual-viewport-height\)/);
  assert.match(globalCss, /--mobile-board-space/);
  assert.match(globalCss, /310px/);
  assert.doesNotMatch(gameClient, /online-mode-label/);
  assert.match(gameClient, /GAME_THEMES/);
  assert.match(gameClient, /themes\/\$\{gameTheme\}\.webp/);
  assert.match(gameClient, /onMatchResult/);
  assert.match(gameClient, /aria-label="모바일 게임 조작"/);
  assert.match(gameClient, /initialDelay = 105/);
  assert.match(gameClient, /repeatRate = 38/);
  assert.match(
    gameClient,
    /function spawn\(type: PieceName, y = BUFFER_ROWS\)/,
  );
  assert.match(gameClient, /function findSpawnPosition/);
  assert.match(
    gameClient,
    /for \(let y = BUFFER_ROWS; y >= -HIDDEN_SPAWN_ROWS; y -= 1\)/,
  );
  assert.match(gameClient, /if \(y < 0\) overflow = true/);
  assert.match(gameClient, /if \(overflow\) \{\s*finish\(/);
  assert.match(gameClient, /gravity: 420/);
  assert.match(gameClient, /hold: "ShiftLeft"/);
  assert.match(gameClient, /Object\.values\(corners\)\.filter\(Boolean\)\.length < 3/);
  assert.match(gameClient, /JLSTZ_KICKS/);
  assert.match(gameClient, /I_KICKS/);
  assert.match(gameClient, /lastRotationKickIndex/);
  assert.match(gameClient, /T-SPIN MINI/);
  assert.match(gameClient, /event\.currentTarget\.blur\(\)/);
  assert.match(gameClient, /\.filter\(\(player\) => !player\.spectating\)/);
  assert.match(gameClient, /startAt: number/);
  assert.match(gameClient, /beginCountdown\(startAt\)/);
  assert.match(gameClient, /className="match-countdown"/);
  assert.match(gameClient, /OUT OF FOCUS/);
  assert.match(gameClient, /hard-drop-impact impact-/);
  assert.match(gameClient, /navigator\.vibrate\?\./);
  assert.match(gameClient, /Array\.from\(\{ length: 14 \}/);
  assert.match(gameClient, /clear-particles-/);
  assert.match(gameClient, /fullRowIndexes/);
  assert.match(gameClient, /--impact-y/);
  assert.match(gameClient, /--particle-origin-y/);
  assert.match(gameClient, /particle-shape-/);
  assert.match(globalCss, /@keyframes hard-drop-shake/);
  assert.match(globalCss, /\.board-impact \{[\s\S]*340ms/);
  assert.match(globalCss, /\.mobile-match-chat/);
  assert.match(globalCss, /@keyframes line-particle-burst/);
  assert.match(globalCss, /@keyframes line-callout/);
  assert.match(globalCss, /\.particle-shape-1/);
  assert.match(globalCss, /\.remote-player-identity/);
  assert.match(
    globalCss,
    /\.remote-player-hotkey[\s\S]*align-items: center[\s\S]*padding: 0/,
  );
  assert.match(
    globalCss,
    /\.lobby-code-panel strong[\s\S]*clamp\(28px, 2\.5vw, 36px\)/,
  );
  assert.match(gameClient, /const LOCK_DELAY_MS = 350/);
  assert.match(gameClient, /const MAX_LOCK_RESETS = 8/);
  assert.match(gameClient, /const MAX_GROUNDED_MS = 1800/);
  assert.match(gameClient, /aria-label="왼손 이동 조이스틱"/);
  assert.match(gameClient, /className="joystick-base"/);
  assert.match(gameClient, /const radius = 46/);
  assert.match(gameClient, /distance >= JOYSTICK_DEADZONE/);
  assert.match(gameClient, /stepDownRef\.current\(\)/);
  assert.match(gameClient, /rules: rulesRef\.current/);
  assert.match(gameClient, /온라인 대전은 방장의 설정을 모든 참가자에게 동일하게 적용합니다/);
  assert.match(gameClient, /T-SPIN DOUBLE!/);
  assert.match(gameClient, /tetstar-identity-v1/);
  assert.match(authGate, /WELCOME TO TETSTAR/);
  assert.match(authGate, /CREATE ACCOUNT/);
  assert.match(authGate, /SEND RESET LINK/);
  assert.match(authGate, /ProfileDashboard/);
  assert.match(authGate, /mobile_control_layout/);
  assert.match(
    authGate,
    /가입한 회원이 사용 중인 username입니다\. 다른 이름을 선택해주세요\./,
  );
  assert.match(profileDashboard, /모드별 최고 기록/);
  assert.match(profileDashboard, /send_friend_request/);
  assert.match(profileDashboard, /className="profile-refresh"/);
  assert.match(profileDashboard, /MOBILE CONTROLS/);
  assert.match(profileDashboard, /mobile_control_layout/);
  assert.match(profileDashboard, /친구 기록 랭킹/);
  assert.match(profileDashboard, /친구 맞대결 전적/);
  assert.match(profileDashboard, /head_to_head_records/);
  assert.match(gameClient, /submit_head_to_head/);
  assert.match(gameClient, /headToHead/);
  assert.match(migration, /alter table public\.profiles enable row level security/);
  assert.match(migration, /is_username_available/);
  assert.match(writeLockMigration, /revoke update on public\.profiles/);
  assert.match(
    writeLockMigration,
    /revoke insert, update on public\.mode_records/,
  );
  assert.match(
    directoryGrantMigration,
    /grant select on public\.account_directory to service_role/,
  );
  assert.match(usernameAuth, /withSupabase/);
  assert.match(usernameAuth, /context\.supabaseAdmin/);
  assert.match(usernameAuth, /username 또는 비밀번호가 올바르지 않습니다/);
  assert.doesNotMatch(usernameAuth, /sb_secret_|service_role.*=/i);
  assert.match(socialMigration, /create table if not exists public\.friendships/);
  assert.match(socialMigration, /create or replace function public\.record_game_result/);
  assert.match(socialMigration, /security definer/);
  assert.match(socialMigration, /participants read friendships/);
  assert.match(
    headToHeadMigration,
    /create table if not exists public\.head_to_head_records/,
  );
  assert.match(
    headToHeadMigration,
    /create or replace function public\.submit_head_to_head/,
  );
  assert.match(headToHeadMigration, /on conflict do nothing/);
  assert.match(socialMigration, /records readable by player or friends/);
  assert.match(
    personalBestMigration,
    /create or replace function public\.submit_game_result/,
  );
  assert.match(personalBestMigration, /'personal_best'/);
  assert.match(personalBestMigration, /security definer/);
  assert.match(icon, /<svg/);
  assert.match(icon, /<rect/);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/themes/megacity.webp", import.meta.url));
  await access(new URL("../public/themes/orbit.webp", import.meta.url));
  await access(new URL("../public/themes/refinery.webp", import.meta.url));
  await access(
    new URL("../app/fonts/PretendardVariable.woff2", import.meta.url),
  );
  await access(new URL("../public/LICENSE-PRETENDARD.txt", import.meta.url));
});
