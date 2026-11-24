const PARTICIPANT_ROOM_POSITION = new Vector3(0, 20, 0);
const WAITING_ROOM_POSITION     = new Vector3(0, 20, 5);
const MEETING_ROOM_POSITION     = new Vector3(0, 3,-10);

const DISCUSSION_TIME = 10; // 会議時間[秒]
const VOTING_TIME = 100;     // 投票時間[秒]

const CORPSE_MARKER_COUNT = 6; // 死体マーカーの数
const MAX_IMPOSTERS = 5;       // キルセンサーの数(インポスターの最大数)
const RETURN_TO_LOBBY_DELAY = 5; // ゲーム終了後、WAITING_ROOMへ飛ばすまでの秒数(PlayerScript.jsのRESULT_DISPLAY_TIMEと合わせる)

const UNDERWAITINGROOMHEIGHT = 9;

// ===== 役職設定 =====
// faction は既存の陣営判定に使う。
// 特殊役職を追加するときは、ここに定義を追加する。
const ROLE_DEFINITIONS = {
  engineer: {
    faction: "crew",
    name: "エンジニア",
    defaultCount: 1,
    maxCount: 10,
    abilities: ["vent"] // ベントを無制限に使用できる
  }
};
const MAX_SPECIAL_ROLE_COUNT = 10;

function createDefaultRoleCounts() {
  const counts = {};
  for (const [roleId, def] of Object.entries(ROLE_DEFINITIONS)) {
    counts[roleId] = def.defaultCount ?? 0;
  }
  return counts;
}

// ==== TextView =====
const textView = $.subNode("TextView");
const participantsText = $.subNode("participantsText");

// ===== タスク設定 =====
const TASKS_PER_PLAYER = { common: 1 }; // common: 全員の候補から1つ
const TYPE_LABEL = { common: "共通" };
const DEBUG_TASK_LOG = true;

// ===== 死亡したクルーのタスク(待機室での作業)の設定 =====
const GHOST_STEP_SECONDS = 100;   // 時間経過で1タスク完了するまでの秒数
const GHOST_ACTION_REDUCE = 10;  // 待ち時間が縮む秒数
const GHOST_ACTION_COOLDOWN = 2; // 作業台を続けて使えるようになるまでの秒数(連打の防止)
const GHOST_ACTION_MAX = 20;     // 1回の作業で縮められる秒数の上限(GhostCalc.js など、秒数を指定する作業台用)

// ===== サボタージュの設定 =====
const SABOTAGE_FIRST_COOLDOWN = 20; // ゲーム開始から、最初のサボタージュを起こせるまでの秒数
const SABOTAGE_COOLDOWN = 30;       // サボタージュが直ってから、次を起こせるまでの秒数
const REACTOR_SECONDS = 45;         // 発電機の暴走: この秒数以内に直せないと、インポスターの勝ち
const PANEL_HOLD_SECONDS = 3;       // 発電機の暴走: パネルを押してから、この秒数のあいだ「押している」とみなす
const REACTOR_PANELS = ["reactorPanel0", "reactorPanel1"].map(name => $.worldItemReference(name));

// ===== 電球タスクの設定 =====
const LIGHT_LEVERS = 6;

// ===== ゴミ捨てタスクの設定 =====
const TRASHBOX_NAMES = ["キッチン", "使用人室", "応接室", "温室", "図書室"];
const TRASH_PICK = 3;
const TRASH_MANAGER = $.worldItemReference("trashManager");

// ===== ボイラータスクの設定 =====
const BOILER_COUNT = 3;
const COAL_PER_BOILER = 3;

// ===== ワインを注ぐタスクの設定 =====
const WINE_GLASSES = 3; // 注ぐグラスの数(WineManager.js の GLASSES と同じにする)

// ===== ピアノタスクの設定 =====
// 鍵盤の番号: 0=ド 1=レ 2=ミ 3=ファ 4=ソ 5=ラ 6=シ 7=高いド
const MELODIES = [
  { name: "メリーさんの羊", notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] },       // ミレドレミミミ レレレ ミソソ
  { name: "かえるの合唱", notes: [0, 1, 2, 3, 2, 1, 0, 2, 3, 4, 5, 4, 3, 2] },     // ドレミファミレド ミファソラソファミ
  { name: "きらきら星", notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 1, 1, 0] },          // ドドソソララソ ファファミレレド
  { name: "ちょうちょ", notes: [4, 2, 2, 3, 1, 1, 0, 1, 2, 3, 4, 4, 4] },          // ソミミ ファレレ ドレミファソソソ
];
const PIANOS = ["piano0", "piano1", "piano2", "piano3"].map(name => $.worldItemReference(name));

// ==== worldItemReferenceの設定 ====
let corpseMarkers = [];
for (let i = 0; i < CORPSE_MARKER_COUNT; i++) {
  corpseMarkers.push($.worldItemReference(`corpseMarker${i}`));
}
const CORPSEMARKERS = corpseMarkers;

let killSensors = [];
for (let i = 0; i < MAX_IMPOSTERS; i++) {
  killSensors.push($.worldItemReference(`killSensor${i}`));
}
const KILLSENSORS = killSensors;

// ===== ハンバーガータスクの設定 =====
const BURGER_MIDDLE = ["steak", "cheese", "cabbage", "tomato"]; // 順番がランダムになる材料(下のパンと、最後の上のパンは固定)
const BURGER_TOP = "upper";
const BURGER_NAMES = { steak: "パティ", cheese: "チーズ", cabbage: "キャベツ", tomato: "トマト", upper: "上のパン" };
const BURGER_BASES = ["burgerBase", "burgerBase1", "burgerBase2"].map(name => $.worldItemReference(name));

const START_BT = $.worldItemReference("startBt");
const PLAYER_SCRIPT_GIVER = $.worldItemReference("setPlayerScript"); // PlayerScript を渡す係(setPlayerScript.js)


const TASK_DEFS = {
  common: [
    { id: "dish", name: "皿を並べる", room: "食堂", label: "皿を6枚、テーブルに並べる" },
  ],
  short: [
    { id: "light", name: "電気をつける", lever: true, room: "広間", label: "レバーを操作して電気をつける" },
    { id: "power", name: "発電", boilers: true, room: "ボイラー室", label: "ボイラーに燃料を入れて発電" },
    { id: "trash", name: "ゴミ捨て", places: true, room: "ゴミ捨て場", label: "ごみを集めて捨て場に捨てる" },
    { id: "burger", name: "ハンバーガーを作る", burger: true, room: "厨房", label: "指定の順番どおりに材料を積む" },
    { id: "pour", name: "ワインを注ぐ", wine: true, room: "ワイン室", label: "グラス3つにワインを注ぐ" },
    { id: "laundry", name: "洗濯", room: "浴室", label: "干してある洗濯物を片付ける" },
    { id: "books", name: "本を片付ける", room: "図書室", label: "散らばった本を5冊棚に戻す" },
    { id: "addition", name: "計算する", room: "研究室", label: "計算問題を3問、続けて解く" },
    { id: "piano", name: "ピアノを弾く", melody: true, room: "音楽室", label: "指定された曲を最後まで弾く" },
    { id: "cipher", name: "IDを入力", room: "書斎", label: "自分のUserIdを入力する" },
    { id: "lamps", name: "ランプを消す", room: "寝室A", label: "ランプつけ、ベットを整える" },
    { id: "sheet", name: "シーツ交換", room: "使用人室", label: "シーツを2個、ベッドにつける" },
    { id: "chairs", name: "椅子を並べる", room: "応接室", label: "椅子を4席、きれいに並べる" },
    { id: "plants", name: "水やり", room: "温室", label: "植物6つにじょうろで水をやる" },
    { id: "dice", name: "サイコロを振る", dice: true, room: "研究室", label: "サイコロで指定の目を出す" },
    { id: "faucet", name: "蛇口を閉める", room: "キッチン", label: "出しっぱなしの蛇口を閉める" },
  ],
};



$.onStart(() => {
  $.state.timer = 0;
  $.state.participants = [];   // 参加予定のプレイヤー
  $.state.imposterNum = 1;
  $.state.shortTaskNum = 6;
  $.state.impostors = [];
  $.state.crews = [];
  $.state.deadPlayers = [];
  $.state.specialRolePlayers = {}; // { roleId: PlayerHandle[] }\n  $.state.roleCounts = createDefaultRoleCounts();
  $.state.taskStatus = {};     // { プレイヤーID: { fake, tasks: [...] } } 全員のタスクの進み具合
  $.state.taskRemain = 1;      // 0~1
  $.state.allTask = 1;
  $.state.phase = "lobby";     // lobby | playing | meeting | voting | ended
  $.state.phaseTimer = 0;
  $.state.votes = {};          // { voterId: targetId or Skip }
  $.state.usedCorpseMarkers = []; // 使用中マーカーのindex一覧
  $.state.killAreaPlayers = []; // キルエリアを表示中のプレイヤー
  $.state.canStart = false;    // 開始できる人数がそろっているか(StartBtに教えた最新の値)
  $.state.impostorIds = [];    // このゲームのインポスターのid(追放・退室後も覚えておく。状況ボード用)
  $.state.sabotage = newSabotage(0); // サボタージュの状態
  $.state.ghosts = {};         // { プレイヤーID: { timer, cool } } 死亡したクルーの、次のタスクが自動で完了するまでの残り秒数

  hideAllKillAreas();
  updateStatusBoard();
});


$.onUpdate(deltaTime => {
  if ($.state.phase === "lobby") {
    updateLobby(deltaTime);
    return;
  }

  if ($.state.phase === "playing") {
    updateGhostTasks(deltaTime);
    updateSabotage(deltaTime);
    return;
  }

  if ($.state.phase === "meeting" || $.state.phase === "voting") {
    const remaining = $.state.phaseTimer - deltaTime;
    if (remaining <= 0) {
      if ($.state.phase === "meeting") {
        startVoting();
      } else {
        finishVoting();
      }
    } else {
      $.state.phaseTimer = remaining;
    }
    return;
  }

  if ($.state.phase === "ended") {
    const remaining = $.state.phaseTimer - deltaTime;
    if (remaining <= 0) {
      returnToLobby();
    } else {
      $.state.phaseTimer = remaining;
    }
  }
});



function updateLobby(deltaTime) {
  let timer = $.state.timer + deltaTime;
  if (timer < 0.7) { $.state.timer = timer; return; }
  $.state.timer = 0;

  const overlaps = $.getOverlaps();
  const overlappingPlayers = overlaps.map(o => o.handle).filter(h => h?.type === "player");
  const overlapIds = new Set(overlappingPlayers.map(p => p.id));

  let participants = $.state.participants;

  // 追加
  for (const participant of overlappingPlayers) {
    if (!participants.some(p => p.id === participant.id)) {
      participants = [...participants, participant];
      participant.setPosition(PARTICIPANT_ROOM_POSITION);
      PLAYER_SCRIPT_GIVER.send("assign", participant); // 参加者になった人にだけ、PlayerScript を渡す(渡す処理は setPlayerScript.js)
    }
  }
  // 削除
  const leaving = participants.filter(p => !overlapIds.has(p.id));
  for (const p of leaving) {
    p.setPosition(WAITING_ROOM_POSITION);
  }

  participants = participants.filter(p => overlapIds.has(p.id));
  participantsText.setText("参加者\n" + participants.map(participant => participant.userDisplayName).join('\n'));

  $.state.participants = participants;
  setCanStart(participants.length >= $.state.imposterNum * 2 + 1);
}


function setCanStart(value) {
  if ($.state.canStart === value) return;
  $.state.canStart = value;
  START_BT.send("canStart", value);
}

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "changeImposterNum": { // from ChangeImposterNum. arg: インポスターの数
      $.state.imposterNum = arg;
      break;
    }

    case "changeTaskNum": { // from changeTaskNum. arg: タスクの数
      $.state.shortTaskNum = arg;
      break;
    }

    case "changeRoleCount": { // arg: { roleId, delta }. ロビーで役職人数を変更
      if ($.state.phase !== "lobby") break;
      if (!arg || typeof arg.roleId !== "string" || !Number.isInteger(arg.delta)) break;

      const def = ROLE_DEFINITIONS[arg.roleId];
      if (!def) break;

      const counts = { ...$.state.roleCounts };
      const current = counts[arg.roleId] ?? def.defaultCount ?? 0;
      const maxCount = Math.min(def.maxCount ?? MAX_SPECIAL_ROLE_COUNT, MAX_SPECIAL_ROLE_COUNT);
      const next = Math.max(0, Math.min(maxCount, current + arg.delta));
      counts[arg.roleId] = next;
      $.state.roleCounts = counts;

      // ボタン側で表示を更新できるよう、変更後の人数を返信
      sender.send("roleCountChanged", { roleId: arg.roleId, name: def.name, count: next });
      break;
    }

    case "getRoleCount": { // arg: roleId。ボタン初期化時の表示取得
      if (typeof arg !== "string" || !ROLE_DEFINITIONS[arg]) break;
      sender.send("roleCountChanged", {
        roleId: arg,
        name: ROLE_DEFINITIONS[arg].name,
        count: $.state.roleCounts[arg] ?? ROLE_DEFINITIONS[arg].defaultCount ?? 0
      });
      break;
    }

    case "start": { // from StartBt.
      if ($.state.phase !== "lobby") break;
      const participants = $.state.participants;
      const imposterNum = $.state.imposterNum;

      if (participants.length < imposterNum * 2 + 1) break;
      
      // 探索中のplayerは全員戻す
      const allPlayers = $.getPlayersNear($.getPosition(), Infinity);
      for (const p of allPlayers) {
        const pos = p.getPosition();
        if (pos && pos.y < UNDERWAITINGROOMHEIGHT) {
          p.setPosition(WAITING_ROOM_POSITION);
        }
      }

      const { impostors, crews, specialRolePlayers } =
        assignRoles(participants, imposterNum, $.state.roleCounts);
      $.state.impostors = impostors;
      $.state.crews = crews;
      $.state.specialRolePlayers = specialRolePlayers;
      $.state.impostorIds = impostors.map(p => p.id);
      $.state.phase = "playing";
      setCanStart(false);
      $.state.ghosts = {};
      $.state.sabotage = newSabotage(SABOTAGE_FIRST_COOLDOWN);
      sendMapButtonsPhase("playing");
      $.worldItemReference("bookMessy").send("start", null);
      $.worldItemReference("wateringCan").send("start", null);
      $.worldItemReference("keyBoard").send("start", null);
      $.worldItemReference("addition").send("start", null);
      $.worldItemReference("laundry").send("start", null);
      $.worldItemReference("sheet").send("start", null);
      $.worldItemReference("bedAndLight").send("start", null);
      $.worldItemReference("coalBox").send("start", null);
      $.worldItemReference("cupboard").send("start", null);
      $.worldItemReference("chairs").send("start", null);
      $.worldItemReference("ghostCalc").send("start", null);
      $.worldItemReference("wineManager").send("start", null);

      $.worldItemReference("abort").send("start", participants.length);


      // task配布
      assignTasks(impostors, crews);
      sendTrashPlaces(crews);
      sendPianoMelodies(crews);
      sendBurgerOrders(crews);
      sendDiceTargets(crews);
      sendLightOrders(crews);
      for (const p of [...impostors, ...crews]) {
        p.send("taskRemain", 1);
        sendTaskList(p);
        p.setPosition(MEETING_ROOM_POSITION);
      }


      syncKillSensors();
      syncKillAreas();
      updateStatusBoard();
      break;
    }

    case "kill": { // from killsensor. arg: キルされたプレイヤーのHd
      if ($.state.phase !== "playing") break;
      const victim = arg;
      let crews = $.state.crews;
      if (!crews.some(c => c.id === victim.id)) break;

      placeCorpseMarker(victim, victim.getPosition());

      crews = crews.filter(c => c.id !== victim.id);
      $.state.crews = crews;
      $.state.deadPlayers = [...$.state.deadPlayers, victim];
      victim.send("kill", null);
      updateStatusBoard();

      startGhostTasks(victim.id);
      if (!checkWinCondition()) checkTaskWin();
      break;
    }

    case "requestKill": { //from imposter. sender: キルしようとしたインポスターのHd
      if ($.state.phase !== "playing") break;
      const index = $.state.impostors.findIndex(p => p.id === sender.id);
      if (index === -1) break;
      KILLSENSORS[index].send("tryKill", sender);
      break;
    }

    case "reportCorpse": { // from corpseMarker. arg.reporter: レポートしたプレイヤーのHD, arg.corpseId: victimのId
      if ($.state.phase !== "playing") break;
      startMeeting(arg.reporter, arg.corpseId);
      break;
    }

    case "report": { // from EmergencyBt. arg: ボタンを押したプレイヤーのHd
      if ($.state.phase !== "playing") break;
      startMeeting(arg, null);
      break;
    }

    case "vote": { // from playerscript.
      if ($.state.phase !== "voting") {
        $.log("vote受信するもphaseが違うため無視: phase=" + $.state.phase + " from=" + (sender.userDisplayName ?? sender.id));
        break;
      }

      //log用
      const voterName = sender.userDisplayName ?? sender.id;
      let targetName;
      if (arg === "skip") {
        targetName = "スキップ";
      } else {
      const target = ($.state.candidates ?? []).find(c => c.id === arg);
        targetName = target ? target.name : arg; // 見つからなければIDのまま表示
      }
      $.log(voterName + " が投票: " + targetName);
      //log用ここまで
      const votes = { ...$.state.votes, [sender.id]: arg }; // arg: targetId または "skip"
      $.state.votes = votes;

      const alivePlayers = [...$.state.impostors, ...$.state.crews];
      if (Object.keys(votes).length >= alivePlayers.length) {
        finishVoting();
      }
      break;
    }

    // 担当しているか・すでに終わっていないかをここで確認する。
    case "taskStep": { // from each task. arg.player: 完了したプレイヤーのHd, arg.taskId: タスクのId
    if ($.state.phase !== "playing") break;
    if (!(sender instanceof ItemHandle)) break;

    const player = arg && arg.player;
    if (!player) break;
    const status = $.state.taskStatus;
    const entry = status[player.id];
    if (!entry) break; // 参加していない・死亡/追放済み

    if (entry.ghost) break; // 死亡後のタスクは、待機室の作業と時間経過でだけ進む

    const task = entry.tasks.find(t => t.id === arg.taskId);
    if (!task) break; // そのプレイヤーの担当タスクではない

    if (task.done) break; // すでに完了している

    task.done = true;
    $.state.taskStatus = status;
    sendTaskList(player);

    if (entry.fake) break; // インポスターのフェイクタスクは進捗に数えない
    $.state.taskRemain = $.state.taskRemain - 1;
    $.log("残りタスク" + $.state.taskRemain);

    broadcastTaskRemain();
    checkTaskWin();
    break;
    }
  

    // 電球(LightBulb.js)からの、レバーの進み具合の知らせ。
    // タスク一覧に「押す順番のどこまで押せたか」を出すために、そのプレイヤーの一覧を送り直す。
    case "leverProgress": {
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;

      const player = arg && arg.player;
      if (!player) break;
      const status = $.state.taskStatus;
      const entry = status[player.id];
      if (!entry) break; // 参加していない・死亡/追放済み

      const task = entry.tasks.find(t => t.id === arg.taskId && t.order);
      if (!task) break;

      task.pressedCount = arg.count;
      $.state.taskStatus = status;
      sendTaskList(player);
      break;
    }

    // ごみ箱(TrashBox.js)からの、ごみ集めの進み具合の知らせ。
    // arg.count は「まだ回収していない場所」の配列(TrashBox.jsのnotifyProgressがそのまま送ってくる)。
    // タスク一覧に回収済みの場所を出すために、そのプレイヤーの一覧を送り直す。
    case "trashProgress": {
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;

      const player = arg && arg.player;
      if (!player) break;
      const status = $.state.taskStatus;
      const entry = status[player.id];
      if (!entry) break; // 参加していない・死亡/追放済み

      const task = entry.tasks.find(t => t.id === arg.taskId && t.places);
      if (!task) break;
      if (!Array.isArray(arg.count)) break;

      // 割り当てられていない場所が混ざっていても無視する
      task.placesLeft = arg.count.filter(p => task.places.includes(p));
      $.state.taskStatus = status;
      sendTaskList(player);
      break;
    }

    // 石炭箱(CoalBox.js)からの、ボイラーに入れた石炭の数の知らせ。
    // arg.count は「ボイラーごとの入れた数」の配列(例: [3, 1, 0])。
    case "coalProgress": {
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;

      const player = arg && arg.player;
      if (!player) break;
      const status = $.state.taskStatus;
      const entry = status[player.id];
      if (!entry) break; // 参加していない・死亡/追放済み

      const task = entry.tasks.find(t => t.id === arg.taskId && t.boilerCounts);
      if (!task) break;
      if (!Array.isArray(arg.count) || arg.count.length !== BOILER_COUNT) break;

      task.boilerCounts = arg.count;
      $.state.taskStatus = status;
      sendTaskList(player);
      break;
    }

    // ワイン樽の橋渡し(WineManager.js)からの、注いだグラスの数の知らせ。arg.count: 注いだ数
    case "wineProgress": {
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;
      const player = arg && arg.player;
      if (!player) break;
      const status = $.state.taskStatus;
      const entry = status[player.id];
      if (!entry) break;
      const task = entry.tasks.find(t => t.id === arg.taskId && t.wineCount !== undefined);
      if (!task) break;
      task.wineCount = arg.count;
      $.state.taskStatus = status;
      sendTaskList(player);
      break;
    }

    // 待機室の作業台(GhostWork.js)からの、死亡したプレイヤーの作業。そのプレイヤーの待ち時間を縮める。
    case "ghostAction": { // arg.player: 作業したプレイヤーのHd
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;

      const player = arg && arg.player;
      if (!player) break;
      const ghosts = $.state.ghosts;
      const ghost = ghosts[player.id];
      if (!ghost) break;        // 死亡したクルーではない、またはタスクがもう残っていない

      // arg.amount: 縮める秒数(GhostCalc.js のように、作業台が決める場合)。無ければ、触るだけの作業台(GhostWork.js)の既定値
      const hasAmount = Number.isFinite(arg.amount);
      if (!hasAmount && ghost.cool > 0) break; // 触るだけの作業台は、続けて使えない
      const amount = hasAmount ? Math.min(GHOST_ACTION_MAX, Math.max(0, arg.amount)) : GHOST_ACTION_REDUCE;

      ghost.timer = Math.max(0, ghost.timer - amount);
      if (!hasAmount) ghost.cool = GHOST_ACTION_COOLDOWN;
      $.state.ghosts = ghosts;
      break;
    }

    // インポスターの画面のボタン(PlayerScript.js)からの、サボタージュの発動。arg: "blackout"(停電) または "reactor"(発電機の暴走)
    case "requestSabotage": {
      if ($.state.phase !== "playing") break;
      if (!$.state.impostors.some(p => p.id === sender.id)) break; // インポスターだけ
      if (arg !== "blackout" && arg !== "reactor") break;
      const sab = $.state.sabotage;
      if (sab.type || !sab.ready) break; // 起きている最中、またはクールダウン中
      startSabotage(arg);
      break;
    }

    // 復旧の装置(BlackoutLever.js / ReactorPanel.js)からの、復旧の操作。arg: { player, kind: "blackout" | "reactor" }
    case "sabotageFix": {
      if ($.state.phase !== "playing") break;
      if (!(sender instanceof ItemHandle)) break;
      const player = arg && arg.player;
      if (!player) break;
      const sab = $.state.sabotage;
      if (!sab.type || sab.type !== arg.kind) break;
      if (![...$.state.impostors, ...$.state.crews].some(p => p.id === player.id)) break; // 生きている人だけ

      if (sab.type === "blackout") { // 停電: レバーを1回操作すれば復旧
        endSabotage();
        break;
      }
      // 発電機の暴走: 2つのパネルを、別々のプレイヤーが、同時に(PANEL_HOLD_SECONDS 以内に)押す
      const index = REACTOR_PANELS.findIndex(r => r.id === sender.id);
      if (index === -1) break;
      sab.panels[index] = { id: player.id, until: PANEL_HOLD_SECONDS };
      $.state.sabotage = sab;
      break;
    }

    case "requestVent": { // from vent. arg: ベントを利用するプレイヤーのHandle
      const player = arg;
      if (!player) break;

      if ($.state.phase === "lobby") {
        sender.send("ventUse", player);
        break;
      }
      if ($.state.phase !== "playing") break;

      const alivePlayers = [...$.state.impostors, ...$.state.crews];
      if (!alivePlayers.some(p => p.id === player.id)) break;

      const isImposter = $.state.impostors.some(p => p.id === player.id);
      const hasVentAbility = Object.entries(ROLE_DEFINITIONS).some(([roleId, def]) => {
        if (!(def.abilities ?? []).includes("vent")) return false;
        return ($.state.specialRolePlayers[roleId] ?? []).some(p => p.id === player.id);
      });

      if (isImposter || hasVentAbility) {
        sender.send("ventUse", player);
      }
      break;
    }
  
    case "abort":{ //from Abort.
      if($.state.phase === "playing") endGame("中止");
      break;
    }
  }
}, { player: true });



function placeCorpseMarker(victim, position) {
  if (!position) { // 位置が取れなかった(読み込み中や退室直後など)
    $.log("遺体の位置が取れなかったため、死体マーカーを置けません: " + victim.userDisplayName);
    return;
  }
  const used = $.state.usedCorpseMarkers;
  const freeIndex = CORPSEMARKERS.findIndex((m, i) => !used.includes(i));
  if (freeIndex === -1) {
    $.log("死体マーカーの空きがありません");
    return;
  }
  CORPSEMARKERS[freeIndex].send("setCorpse", {
    id: victim.id,
    name: victim.userDisplayName,
    pos: position,
    markerIndex: freeIndex
  });
  $.state.usedCorpseMarkers = [...used, freeIndex];
}

function clearCorpseMarkers() {
  for (const marker of CORPSEMARKERS) {
    marker.send("hideCorpse", null);
  }
  $.state.usedCorpseMarkers = [];
}


function syncKillSensors() {
  const impostors = $.state.impostors;
  for (let i = 0; i < KILLSENSORS.length; i++) {
    if (i < impostors.length) {
      KILLSENSORS[i].send("bindImposter", impostors[i]);
    } else {
      KILLSENSORS[i].send("unbind", null);
    }
  }
}


function syncKillAreas() {
  const impostors = $.state.impostors;
  const currentIds = new Set(impostors.map(p => p.id));

  for (const p of $.state.killAreaPlayers) {
    if (!currentIds.has(p.id) && p.exists()) {
      p.send("hideKillArea", null);
    }
  }

  for (let i = 0; i < impostors.length; i++) {
    impostors[i].send("showKillArea", i);
  }

  $.state.killAreaPlayers = [...impostors];
}


function hideAllKillAreas() {
  for (const p of $.state.killAreaPlayers) {
    if (p.exists()) p.send("hideKillArea", null);
  }
  $.state.killAreaPlayers = [];
}


function startMeeting(reporter, reportedCorpseId) {
  $.state.phase = "meeting";
  $.state.phaseTimer = DISCUSSION_TIME;
  $.state.votes = {};
  updateStatusBoard();

  $.worldItemReference("meetingBlock").send("blockPos", null);
  clearCorpseMarkers();

  // 通報された死体のIDから名前を引く（緊急ボタンでの通報ならnullのまま)
  const corpse = reportedCorpseId
    ? $.state.deadPlayers.find(p => p.id === reportedCorpseId)
    : null;
  const corpseName = corpse ? corpse.userDisplayName : null;

  const alivePlayers = [...$.state.impostors, ...$.state.crews];
  for (const p of alivePlayers) {
    p.setPosition(MEETING_ROOM_POSITION);
    p.send("meetingStart", {
      reporterName: reporter.userDisplayName,
      corpseId: reportedCorpseId,
      corpseName: corpseName,
      duration: DISCUSSION_TIME
    });
  }
  $.log(reporter.userDisplayName + " が通報しました" + (corpseName ? "（" + corpseName + "の遺体）" : ""));
}


function startVoting() {
  $.state.phase = "voting";
  $.state.phaseTimer = VOTING_TIME;
  $.state.votes = {};
  updateStatusBoard();

  const alivePlayers = [...$.state.impostors, ...$.state.crews];
  const candidates = alivePlayers.map(p => ({ id: p.id, name: p.userDisplayName }));
  $.state.candidates = candidates;
  for (const p of alivePlayers) {
    p.send("votingStart", { candidates, duration: VOTING_TIME });
  }
}


function finishVoting() {
  // 集計中に追加でvoteが来ないようにphaseをtallyにする
  $.state.phase = "tally";
  const votes = $.state.votes;

  const tally = {};
  for (const voterId in votes) {
    const target = votes[voterId];
    tally[target] = (tally[target] ?? 0) + 1;
  }

  let ejectedId = null;
  let maxVotes = 0;
  let isTie = false;
  for (const targetId in tally) {
    const count = tally[targetId];
    if (count > maxVotes) {
      maxVotes = count;
      ejectedId = targetId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }
  
  if (isTie || ejectedId === "skip") ejectedId = null;

  
  const alivePlayers = [...$.state.impostors, ...$.state.crews];
  let ejectedPlayer = null;
  let ejectedRole = null;

  if (ejectedId) {
    ejectedPlayer = alivePlayers.find(p => p.id === ejectedId) ?? null;

    if (!ejectedPlayer) {
      // 投票中に対象が退室した等で、alivePlayers内に見つからないケース
      $.log("追放対象が見つかりませんでした（退室した可能性があります）: " + ejectedId);
    } else {
      const wasImpostor = $.state.impostors.some(p => p.id === ejectedId);
      ejectedRole = wasImpostor ? "imposter" : "crew";

      $.state.impostors = $.state.impostors.filter(p => p.id !== ejectedId);
      $.state.crews = $.state.crews.filter(p => p.id !== ejectedId);
      $.state.deadPlayers = [...$.state.deadPlayers, ejectedPlayer];
      ejectedPlayer.setPosition(WAITING_ROOM_POSITION);
      if (wasImpostor) dropTasksOf(ejectedId); // インポスターのフェイクタスクは、数えない
      else startGhostTasks(ejectedId);         // 追放されたクルーのタスクは、待機室での作業と時間経過で進める

      $.log(ejectedPlayer.userDisplayName + " が追放されました（" + ejectedRole + "）");
    }
  }

  updateStatusBoard();

  for (const p of alivePlayers) {
    p.send("votingResult", {
      ejectedName: ejectedPlayer ? ejectedPlayer.userDisplayName : null,
      ejectedRole: ejectedRole,
      wasEjected: ejectedPlayer ? p.id === ejectedPlayer.id : false
    });
  }

  syncKillSensors();
  syncKillAreas();
  $.worldItemReference("meetingBlock").send("hidePos", null);

  if (checkWinCondition()) return;
  if (checkTaskWin()) return;

  $.state.phase = "playing";
  updateStatusBoard();
  sendSabotageState(); // 会議中は画面から消えていた、サボタージュの表示を戻す

  const survivors = [...$.state.impostors, ...$.state.crews];
  for (const p of survivors) {
    p.setPosition(MEETING_ROOM_POSITION);
  }
}

function checkWinCondition() {
  const impostorCount = $.state.impostors.length;
  const crewCount = $.state.crews.length;

  if (impostorCount === 0) {
    endGame("crew");
    return true;
  }
  
  if (impostorCount >= crewCount) {
    endGame("imposter");
    return true;
  }
  return false;
}

function endGame(winner) {
  $.state.phase = "ended";
  $.state.phaseTimer = RETURN_TO_LOBBY_DELAY;
  clearSabotage();

  const deadIds = new Set($.state.deadPlayers.map(p => p.id)); // 死亡(キル・追放)したプレイヤーのid
  const everyone = [...$.state.impostors, ...$.state.crews, ...$.state.deadPlayers];
  for (const p of everyone) {
    p.send("gameEnd", { winner: winner, wasDead: deadIds.has(p.id) });
  }
  updateStatusBoard(winner === "crew" ? "クルーの勝利!" : winner === "imposter" ? "インポスターの勝利!" : "ゲームを中止しました");

  for (const sensor of KILLSENSORS) {
    sensor.send("unbind", null);
  }
  hideAllKillAreas();
}

function sendMapButtonsPhase(phase) {
  for (const name of ["mapExploreBt", "mapReturnBt"]) {
    $.worldItemReference(name).send("phase", phase);
  }
}


function returnToLobby() {
  const survivors = [...$.state.impostors, ...$.state.crews]
    .filter(p => p.exists()); // ゲーム中に退室したプレイヤーを除外

  for (const p of survivors) {
    p.setPosition(WAITING_ROOM_POSITION);
  }

  $.state.impostors = [];
  $.state.crews = [];
  $.state.deadPlayers = [];
  $.state.specialRolePlayers = {};
  $.state.votes = {};
  $.state.taskStatus = {};
  $.state.ghosts = {};
  $.state.impostorIds = [];
  $.state.sabotage = newSabotage(0);
  clearCorpseMarkers();

  $.state.phase = "lobby";
  updateStatusBoard();
 sendMapButtonsPhase("lobby");
  $.state.timer = 0;
}

// ===== タスクの割り当てと進捗 =====

function pickRandom(list, n) {
  const copy = [...list];
  // Fisher-Yatesでシャッフルして先頭からn個
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function makeTask(def, type) {
  const task = {
    id: def.id,
    name: def.name,
    type: type,
    room: def.room,
    label: def.label,
    done: false
  };
  if (def.lever) {
    // レバー式のタスク: 人ごとにランダムな押す順番を決める(例: [3, 0, 5, 2])
    const levers = [];
    for (let i = 0; i < LIGHT_LEVERS; i++) levers.push(i); // 0〜(LIGHT_LEVERS-1)
    task.order = pickRandom(levers, LIGHT_LEVERS);
    task.pressedCount = 0; // 正しい順番で押せた数(LightBulb.jsから"leverProgress"で更新される)
  }
  if (def.places) {
    // 場所を回って集めるタスク: 人ごとにランダムな回収場所を決める(例: ["キッチン", "応接室", "温室"])
    const selected = pickRandom(TRASHBOX_NAMES, TRASH_PICK);
    const places = TRASHBOX_NAMES.filter(name => selected.includes(name));
    task.places = places;
    task.placesLeft = [...task.places]; // まだ回収していない場所(TrashBox.jsから"trashProgress"で更新される)
  }
  if (def.melody) {
    // 曲を弾くタスク: 人ごとにランダムな曲を決める。その曲を担当するピアノで弾いたときだけ完了する
    const index = Math.floor(Math.random() * MELODIES.length);
    task.melodyIndex = index;
    task.melodyName = MELODIES[index].name;
  }
  if (def.burger) {
    // ハンバーガータスク: 人ごとにランダムな材料の順番を決める(最後は必ず上のパン。例: ["cheese", "steak", "tomato", "cabbage", "upper"])
    task.burgerOrder = [...pickRandom(BURGER_MIDDLE, BURGER_MIDDLE.length), BURGER_TOP];
  }
  if (def.dice) {
    // サイコロのタスク: 人ごとにランダムな目(1〜6)を決める。Dice.js が、投げた人の目と出た目を照らし合わせる
    task.diceTarget = Math.floor(Math.random() * 6) + 1;
  }
  if (def.wine) {
    task.wineCount = 0; // 注いだグラスの数。WineManager.jsから"wineProgress"で更新される
  }
  if (def.boilers) {
    // ボイラーに石炭を入れるタスク: ボイラーごとに、入れた数を数える(例: [3, 1, 0])
    task.boilerCounts = Array(BOILER_COUNT).fill(0); // CoalBox.jsから"coalProgress"で更新される
  }
  return task;
}

// 電球(LightBulb.js)に、クルーそれぞれの押す順番を教える。
// インポスターのフェイクタスクの順番は教えない(=インポスターがレバーを押しても、電球は光らない)。
function sendLightOrders(crews) {
  const taskOrders = {};
  for (const p of crews) {
    const entry = $.state.taskStatus[p.id];
    const task = entry ? entry.tasks.find(t => t.order) : null;
    if (task) taskOrders[p.id] = task.order;
  }
  $.worldItemReference("lightBulb").send("start", { taskOrders: taskOrders });
}

function sendTrashPlaces(crews) {
  const taskPlaces = {};
  for (const p of crews) {
    const entry = $.state.taskStatus[p.id];
    const task = entry ? entry.tasks.find(t => t.places) : null;
    if (task) taskPlaces[p.id] = [...task.places];
  }
  TRASH_MANAGER.send("start", { taskPlaces: taskPlaces });
}

// 曲ごとのピアノ(Piano.js)に、担当する曲の音の並びと、その曲を割り当てられたクルーを教える。
// インポスターのフェイクタスクの曲は教えない(=インポスターが弾いても、完了にならない)。
function sendPianoMelodies(crews) {
  for (let i = 0; i < MELODIES.length; i++) {
    const players = [];
    for (const p of crews) {
      const entry = $.state.taskStatus[p.id];
      const task = entry ? entry.tasks.find(t => t.melodyIndex === i) : null;
      if (task) players.push(p.id);
    }
    PIANOS[i].send("start", { notes: MELODIES[i].notes, players: players });
  }
}


// 土台(BurgerBase.js。すべての作業台)に、クルーそれぞれの材料の順番を教える。
// インポスターのフェイクタスクの順番は教えない(=インポスターが積んでも、完了にならない)。
function sendBurgerOrders(crews) {
  const taskOrders = {};
  for (const p of crews) {
    const entry = $.state.taskStatus[p.id];
    const task = entry ? entry.tasks.find(t => t.burgerOrder) : null;
    if (task) taskOrders[p.id] = task.burgerOrder;
  }
  for (const base of BURGER_BASES) base.send("start", { taskOrders: taskOrders });
}

// サイコロ(Dice.js)に、クルーそれぞれの出す目を教える。
// インポスターのフェイクタスクの目は教えない(=インポスターが投げても、完了にならない)。
function sendDiceTargets(crews) {
  const targets = {};
  for (const p of crews) {
    const entry = $.state.taskStatus[p.id];
    const task = entry ? entry.tasks.find(t => t.diceTarget !== undefined) : null;
    if (task) targets[p.id] = task.diceTarget;
  }
  $.worldItemReference("dice").send("start", { targets: targets });
}

// 材料の順番を1行の文字列にする。例: チーズ → パティ → トマト → キャベツ → 上のパン
function formatBurger(order) {
  return order.map(type => BURGER_NAMES[type]).join(" → ");
}

function assignTasks(impostors, crews) {
  const status = {};
  let total = 0;
  const everyone = [
    ...impostors.map(p => ({ p, fake: true })),
    ...crews.map(p => ({ p, fake: false }))
  ];
  for (const { p, fake } of everyone) {
    const tasks = [];
    for (const d of pickRandom(TASK_DEFS.common, TASKS_PER_PLAYER.common)) tasks.push(makeTask(d, "common"));
    for (const d of pickRandom(TASK_DEFS.short, $.state.shortTaskNum))   tasks.push(makeTask(d, "short"));
    status[p.id] = { fake: fake, tasks: tasks };
    if (!fake) {
      total += tasks.length;
    }
    if (DEBUG_TASK_LOG) {
      $.log("[タスク配布] " + p.userDisplayName + (fake ? " (インポスター・フェイク)" : " (クルー)") + ": " +
        tasks.map(t => "【" + TYPE_LABEL[t.type] + "】" + t.name).join(" / "));
    }
  }
  $.state.taskStatus = status;
  $.state.allTask = total;
  $.state.taskRemain = total;
  if (DEBUG_TASK_LOG) $.log("[タスク配布] クルー" + crews.length + "人 / 全体 " + total + " タスク");
}

function formatPlaces(places, placesLeft) {
  const left = placesLeft ?? places;
  return places.map(p => (left.includes(p) ? "" : "✓") + p).join(" ");
}

// レバー式タスクの「押す順番」と、いまの進み具合を1行の文字列にする。
// 押せた分は ✓、次に押すレバーは [ ] で囲む。例: ✓3 ✓0 [5] 2
function formatLeverOrder(order, pressedCount) {
  return order.map((lever, i) => {
    const n = lever + 1; // 内部の番号は0〜5。表示は1〜6にする
    if (i < pressedCount) return "✓" + n;
    if (i === pressedCount) return "[" + n + "]";
    return "" + n;
  }).join(" ");
}

// タスク一覧の文字列を作る。
//   タスク 2/5
//   [ ] 発電 〔ボイラー室〕燃料を入れる
//       ボイラー: 1/3 · 0/3 · 2/3
//   [ ] 皿を並べる(共通) 〔食堂〕皿を6枚並べる
//   [✓] 洗濯
// 未完了を上に、完了したものを下にまとめる。完了したタスクは、名前だけにする。
// ghost: 死亡したクルーの待ち時間({ timer, ... })。あれば、次のタスクが完了するまでの残り秒数を、2行目に出す。
function buildTaskText(entry, ghost) {
  const done = entry.tasks.filter(t => t.done);
  const todo = entry.tasks.filter(t => !t.done);
  const lines = ["タスク " + done.length + "/" + entry.tasks.length];
  if (ghost) lines.push("次のタスク完了まで あと " + Math.max(0, Math.ceil(ghost.timer)) + "秒(待機室で作業すると縮む)");
  // 死亡したクルーには、タスクの内容は出さない(マップで作業できないため)。完了数と、残り秒数だけ出す
  for (const t of (entry.ghost ? [] : todo)) {
    const common = t.type === "common" ? "(" + TYPE_LABEL.common + ")" : "";
    lines.push("[ ] " + t.name + common + " 〔" + t.room + "〕" + t.label);
    if (t.order) lines.push("    レバーの順番: " + formatLeverOrder(t.order, t.pressedCount ?? 0));
    if (t.melodyName) lines.push("    曲: " + t.melodyName);
    if (t.burgerOrder) lines.push("    下のパン → " + formatBurger(t.burgerOrder));
    if (t.boilerCounts) lines.push("    ボイラー: " + t.boilerCounts.map(c => c + "/" + COAL_PER_BOILER).join(" · "));
    if (t.diceTarget !== undefined) lines.push("    出す目: " + t.diceTarget);
    if (t.wineCount !== undefined) lines.push("    グラス: " + t.wineCount + "/" + WINE_GLASSES);
    if (t.places) lines.push("    回収する場所: " + formatPlaces(t.places, t.placesLeft));
  }
  if (!entry.ghost) for (const t of done) lines.push("[✓] " + t.name); // 死亡したクルーには出さない
  return lines.join("\n");
}

function sendTaskList(player) {
  const entry = $.state.taskStatus[player.id];
  if (!entry) return;
  const text = buildTaskText(entry, $.state.ghosts[player.id]);
  player.send("taskList", { text: text });
}

// ===== 状況ボード =====
// 例:
//   ゲーム進行中
//   生存者 4人 / 死亡 2人
//   タスク 45%
//
//   生存: A, B(インポスター), C, D
//   死亡: E, F

function updateStatusBoard(headline) {
  let text;
  const phase = $.state.phase;
  if (phase === "lobby") {
    text = headline ?? "参加者募集";
  } else {
    const impostorIds = $.state.impostorIds;
    const names = list => list
      .filter(p => p.exists())
      .map(p => p.userDisplayName + (impostorIds.includes(p.id) ? "(インポスター)" : ""));
    const alive = names([...$.state.impostors, ...$.state.crews]);
    const dead = names($.state.deadPlayers);
    const percent = $.state.allTask > 0
      ? Math.max(0, Math.min(100, Math.round((1 - $.state.taskRemain / $.state.allTask) * 100)))
      : 0;
    const sab = $.state.sabotage;
    const sabTitle = (phase === "playing" && sab && sab.type)
      ? (sab.type === "blackout" ? "停電中!" : "発電機が暴走中! あと " + Math.max(0, Math.ceil(sab.timer)) + "秒")
      : null;
    const title = headline ?? sabTitle ?? (phase === "meeting" ? "会議中" : phase === "voting" ? "投票中" : "ゲーム進行中");
    text = title + "\nタスク " + percent + "%\n\n"
      + "生存: " + (alive.length > 0 ? alive.join(", ") : "なし") + "\n"
      + "死亡: " + (dead.length > 0 ? dead.join(", ") : "なし");
  }
  textView.setText(text);
}

// ===== サボタージュ =====
// 状態: { type: null | "blackout" | "reactor", timer: 発電機の残り秒数, panels: [パネル0, パネル1](押している人と残り秒数),
//         shown: 最後に知らせた残り秒数, cool: 次を起こせるまでの残り秒数, ready: いま起こせるか }
function newSabotage(cool) {
  return { type: null, timer: 0, panels: [null, null], shown: -1, cool: cool, ready: false };
}

function aliveList() {
  return [...$.state.impostors, ...$.state.crews].filter(p => p.exists());
}

function startSabotage(type) {
  const sab = $.state.sabotage;
  sab.type = type;
  sab.timer = REACTOR_SECONDS;
  sab.panels = [null, null];
  sab.shown = -1;
  sab.ready = false;
  $.state.sabotage = sab;
  for (const p of $.state.impostors) p.send("sabotageReady", false);
  sendSabotageState();
  updateStatusBoard();
}

// 起きているサボタージュを、生存者全員の画面に知らせる(開始時と、会議明け)
function sendSabotageState() {
  const sab = $.state.sabotage;
  if (!sab.type) return;
  for (const p of aliveList()) p.send("sabotageStart", { type: sab.type, seconds: Math.ceil(sab.timer) });
}

// 直った: クールダウンを始める
function endSabotage() {
  const sab = $.state.sabotage;
  sab.type = null;
  sab.panels = [null, null];
  sab.cool = SABOTAGE_COOLDOWN;
  sab.ready = false;
  $.state.sabotage = sab;
  for (const p of aliveList()) p.send("sabotageEnd", null);
  updateStatusBoard();
}

// ゲーム終了のとき: 全員の画面から、サボタージュの表示を消す
function clearSabotage() {
  const everyone = [...$.state.impostors, ...$.state.crews, ...$.state.deadPlayers].filter(p => p.exists());
  for (const p of everyone) p.send("sabotageEnd", null);
  $.state.sabotage = newSabotage(0);
}

function updateSabotage(deltaTime) {
  const sab = $.state.sabotage;

  if (!sab.type) {
    if (sab.cool > 0) {
      sab.cool -= deltaTime;
      if (sab.cool <= 0) { // 起こせるようになった: インポスターのボタンを押せるようにする
        sab.cool = 0;
        sab.ready = true;
        for (const p of $.state.impostors) p.send("sabotageReady", true);
      }
      $.state.sabotage = sab;
    }
    return;
  }

  if (sab.type !== "reactor") return; // 停電は、時間切れがない

  sab.timer -= deltaTime;
  for (let i = 0; i < sab.panels.length; i++) {
    const panel = sab.panels[i];
    if (!panel) continue;
    panel.until -= deltaTime;
    if (panel.until <= 0) sab.panels[i] = null;
  }

  const a = sab.panels[0];
  const b = sab.panels[1];
  if (a && b && a.id !== b.id) { // 別々の2人が、同時に押している: 復旧
    $.state.sabotage = sab;
    endSabotage();
    return;
  }
  if (sab.timer <= 0) { // 間に合わなかった: インポスターの勝ち
    $.state.sabotage = sab;
    endGame("imposter");
    return;
  }

  const seconds = Math.ceil(sab.timer);
  if (seconds !== sab.shown) { // 残り秒数が変わったとき(1秒に1回)だけ、画面とボードを更新する
    sab.shown = seconds;
    $.state.sabotage = sab;
    for (const p of aliveList()) p.send("sabotageTime", seconds);
    updateStatusBoard();
    return;
  }
  $.state.sabotage = sab;
}

// 残りタスク量バー用の値(残り/全体)を、生存者全員に送る
function broadcastTaskRemain() {
  updateStatusBoard(); // タスクの進み具合は、ボードにも出す
  const ratio = $.state.allTask > 0 ? $.state.taskRemain / $.state.allTask : 0;
  const alivePlayers = [...$.state.impostors, ...$.state.crews];
  for (const p of alivePlayers) {
    p.send("taskRemain", ratio);
  }
}

// 死亡(キル・追放)したクルーのタスクを、待機室での作業に切り替える。
function startGhostTasks(playerId) {
  const status = $.state.taskStatus;
  const entry = status[playerId];
  if (!entry) return;
  if (entry.fake) { dropTasksOf(playerId); return; }
  if (countRemainingTasks(entry) === 0) return; // 全部終わっている

  entry.ghost = true;
  $.state.taskStatus = status;
  const ghosts = $.state.ghosts;
  ghosts[playerId] = { timer: GHOST_STEP_SECONDS, cool: 0, shown: GHOST_STEP_SECONDS };
  $.state.ghosts = ghosts;
  const player = $.state.deadPlayers.find(p => p.id === playerId);
  if (player) sendTaskList(player); // 残り秒数の行を、すぐに出す
}

function countRemainingTasks(entry) {
  return entry.tasks.filter(t => !t.done).length;
}

// 毎フレーム、死亡したクルーの待ち時間を進める。0になったら、次の1タスクを完了にする。
function updateGhostTasks(deltaTime) {
  const ghosts = $.state.ghosts;
  const ids = Object.keys(ghosts);
  if (ids.length === 0) return;
  const refresh = []; // タスク一覧を送り直すプレイヤー

  for (const id of ids) {
    const ghost = ghosts[id];
    const player = $.state.deadPlayers.find(p => p.id === id);
    if (!player || !player.exists()) { // 退室した: 残りのタスクは、数から外す
      delete ghosts[id];
      dropTasksOf(id);
      continue;
    }

    ghost.cool = Math.max(0, ghost.cool - deltaTime);
    ghost.timer -= deltaTime;

    let changed = false; // タスク一覧の、残り秒数の表示を更新するか
    if (ghost.timer <= 0) {
      completeGhostStep(id, player);
      ghost.timer = GHOST_STEP_SECONDS;
      const entry = $.state.taskStatus[id];
      if (!entry || countRemainingTasks(entry) === 0) delete ghosts[id]; // 全部完了した
      changed = true;
    }
    const secs = Math.ceil(ghost.timer);
    if (changed || ghost.shown !== secs) { // 表示している秒数が変わったときだけ、送り直す(1秒に1回)
      ghost.shown = secs;
      refresh.push(player);
    }
    if ($.state.phase !== "playing") break; // 最後のタスクが終わって、ゲームが終了した
  }
  $.state.ghosts = ghosts;
  for (const p of refresh) sendTaskList(p); // state を更新してから送る(全部完了した人は、秒数の行が消える)
}

// 死亡したクルーの、最初の未完了のタスクを完了にする
function completeGhostStep(playerId, player) {
  const status = $.state.taskStatus;
  const entry = status[playerId];
  if (!entry) return;
  const task = entry.tasks.find(t => !t.done);
  if (!task) return;
  task.done = true;
  if (DEBUG_TASK_LOG) $.log("[待機室でタスク完了] " + player.userDisplayName + ": " + task.name);
  $.state.taskStatus = status;
  $.state.taskRemain = $.state.taskRemain - 1;
  $.log("残りタスク" + $.state.taskRemain);

  sendTaskList(player);
  broadcastTaskRemain();
  checkTaskWin();
}

// タスクをすべて片付ける(退室したときや、インポスターのフェイクタスクに使う)。
// 退場した人の「未完了ぶん」を全体から差し引く(完了済みぶんはそのまま数える)。
function dropTasksOf(playerId) {
  const status = $.state.taskStatus;
  const entry = status[playerId];
  if (!entry) return;
  if (!entry.fake) {
    const incomplete = countRemainingTasks(entry);
    $.state.allTask = $.state.allTask - incomplete;
    $.state.taskRemain = $.state.taskRemain - incomplete;
  }
  delete status[playerId];
  $.state.taskStatus = status;
  broadcastTaskRemain();
}

// 残りタスクが0になっていればクルーの勝利。勝敗が決まったらtrueを返す
function checkTaskWin() {
  if ($.state.taskRemain >= 1) return false;
  endGame("crew");
  return true;
}

function shufflePlayers(players) {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function assignRoles(participants, imposterNum, roleCounts) {
  const shuffled = shufflePlayers(participants);
  const impostors = shuffled.slice(0, imposterNum);
  const crews = shuffled.slice(imposterNum);

  // 陣営ごとの候補をシャッフルしておく。
  // 同じプレイヤーに複数の特殊役職が重複しないよう、割り当てた人は候補から除く。
  const candidates = {
    crew: shufflePlayers(crews),
    imposter: shufflePlayers(impostors)
  };
  const specialRolePlayers = {};

  for (const [roleId, def] of Object.entries(ROLE_DEFINITIONS)) {
    const pool = candidates[def.faction];
    const requested = Math.max(0, Math.floor(roleCounts[roleId] ?? def.defaultCount ?? 0));
    const count = Math.min(requested, pool.length);
    const assigned = pool.splice(0, count);

    specialRolePlayers[roleId] = assigned;

    if (count < requested) {
      $.log("[役職割り当て] " + def.name + " は人数不足のため " + count + "人に割り当て");
    }
  }

  impostors.forEach(p => p.send("assignRoles", "imposter"));
  crews.forEach(p => p.send("assignRoles", "crew"));

  // assignRoles の後に特殊役職を送ることで、PlayerScript側の初期化で消されないようにする。
  for (const [roleId, players] of Object.entries(specialRolePlayers)) {
    const def = ROLE_DEFINITIONS[roleId];
    for (const player of players) {
      player.send("assignSpecialRole", { id: roleId, name: def.name });
    }
  }

  return { impostors, crews, specialRolePlayers };
}
