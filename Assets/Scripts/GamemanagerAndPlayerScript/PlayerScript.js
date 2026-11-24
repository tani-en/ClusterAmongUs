const WAITING_ROOM_POSITION = new Vector3(0, 20, 5);
const MAX_VOTE_BUTTONS = 10; // Player Local UI上に用意しておく投票ボタンの最大数
const MAX_IMPOSTERS = 5;  
const HIDDEN_SCALE = new Vector3(0, 0, 0);
const SHOWN_SCALE = new Vector3(1, 1, 1);
const OFFSCREEN_POS = new Vector2(-99999, -99999); // 非表示時に飛ばす画面外座標
const RESULT_DISPLAY_TIME = 5; // 投票結果/勝敗結果を表示しておく秒数

const GAME_MOVE_SPEED_RATE = 0.5;   // ゲーム中(役職がある間)の移動速度
const NORMAL_MOVE_SPEED_RATE = 1;   // ゲーム外(ロビー・死亡後・追放後・ゲーム終了後)の移動速度

const FORWARD_OFFSET = 1; // インポスターの前方何mにセンサーを置くか

// サボタージュボタンの、画面上の基本位置(Unityで置いた位置)。
// 前のPlayerScriptが画面外に飛ばしたままの位置を「元の位置」と覚えてしまうことがあるので、
// その場合はこの値を使う。Unityでボタンの位置を変えたら、ここも合わせる。
const SAB_BLACKOUT_DEFAULT_POS = new Vector2(-250, 150);
const SAB_REACTOR_DEFAULT_POS = new Vector2(-150, 200);

// 停電を直す配電盤の位置(ワールド座標)。Unity で配電盤を選んで、Inspector の Transform の Position を写す。
// 配電盤が動かないので、ここに固定で書く。複数あるときは、{ x, y, z } を並べる(一番近いものを指す)。
const BLACKOUT_TARGETS = [
  { x: -35.1689987, y: 0.90200001, z: -0.671999991 },   // ← 配電盤の位置に書き換える
];
// 停電中、暗幕の上に出す「配電盤の方向を指す矢印」(Player Local UI の blackoutArrow / blackoutArrowText)
let arrowRect = null, arrowImage = null, arrowText = null;
let arrowReady = false;
let arrowTries = 0;
let arrowRetryWait = 0;

// サボタージュUI用の状態変数
let sabotageUiReady = false;
let sabotageTries = 0;
let sabotageRetryWait = 0;       // 見つかるまでの再試行の間隔を空けるためのタイマー
let sabBlackoutBtn = null, sabReactorBtn = null;
let sabotageText = null, sabotageOverlayRect = null, sabotageOverlayImage = null;
let sabotageButtonsWanted = false;
let sabotageReady = false;
let sabotageActive = null;

// raycastTargetを持つコンポーネントが見つからない場合でもスクリプト全体を止めない
function setRaycastTarget(component, value) {
  if (!component) return;
  component.unityProp.raycastTarget = value;
}

const ROLE_NAMES = { imposter: "インポスター", crew: "クルー" };
const SPECIAL_ROLE_NAMES = {
  engineer: "エンジニア"
};

function displayRoleName() {
  if (role === "crew" && specialRole) {
    return roleName(role) + "（" + SPECIAL_ROLE_NAMES[specialRole] + "）";
  }
  return roleName(role);
}

function roleName(r) { return ROLE_NAMES[r] ?? r; }

const gameManagerId = _.worldItemReference("gameManager");
_.setMoveSpeedRate(NORMAL_MOVE_SPEED_RATE); // ゲームが始まって役職が届くまでは、普通の速さ

let role = "";
let specialRole = "";
let displayCount = -1;       // 役職表示("あなたは○○")を出しておく残り秒数
let phaseTimeLeft = -1;      // 会議/投票の残り時間（ローカルでカウントダウン表示するだけ、判定はGameManager側）
let resultDisplayCount = -1; // 投票結果/勝敗結果を表示しておく残り秒数
let resumeKillButtonAfterResult = false; // 会議明けにキルボタンを復帰させるかどうか
let killCooldownLeft = -1;   // キルクールタイムの残り秒数（判定自体はKillSensor側が権威）
let killButtonShown = false; // 現在キルボタンを表示すべき状態かどうか（クールタイム管理用）

let roleObject = _.playerLocalObject("role").getUnityComponent("Text");
roleObject.unityProp.text = "";
roleObject.unityProp.raycastTarget = false;

let remainObject = _.playerLocalObject("remainTask").getUnityComponent("Text");
remainObject.unityProp.text = "";
remainObject.unityProp.raycastTarget = false;

let assignRolesObject = _.playerLocalObject("assignRoles").getUnityComponent("Text");
assignRolesObject.unityProp.text = "";
assignRolesObject.unityProp.raycastTarget = false;

let meetingObject = _.playerLocalObject("meetingInfo").getUnityComponent("Text");
meetingObject.unityProp.text = "";
meetingObject.unityProp.raycastTarget = false;

let resultObject = _.playerLocalObject("votingResult").getUnityComponent("Text");
resultObject.unityProp.text = "";
resultObject.unityProp.raycastTarget = false;

let timerObject = _.playerLocalObject("phaseTimer").getUnityComponent("Text");
timerObject.unityProp.text = "";
timerObject.unityProp.raycastTarget = false;


// ===== キルエリア(Player Local UI) =====
const KILLAREA_ROOT_ID = "killArea";
const KILLAREA_NAME_PREFIX = "killArea";
let KILLAREAS = [];
let KILLAREA_BASE_ROT = [];
let killAreasReady = false;
let desiredKillArea = -1;

function applyKillAreas() {
  if (!killAreasReady) return;
  for (let i = 0; i < KILLAREAS.length; i++) {
    if (KILLAREAS[i]) KILLAREAS[i].setEnabled(i === desiredKillArea);
  }
}

function tryInitKillAreas() {
  try {
    const root = _.playerLocalObject(KILLAREA_ROOT_ID);
    if (!root) return false;
    const first = root.findObject(KILLAREA_NAME_PREFIX + 0);
    if (!first) return false;

    const built = [];
    for (let i = 0; i < MAX_IMPOSTERS; i++) {
      built.push(root.findObject(KILLAREA_NAME_PREFIX + i));
    }
    KILLAREAS = built;
    KILLAREA_BASE_ROT = [];
    for (let i = 0; i < KILLAREAS.length; i++) {
      const r = KILLAREAS[i] ? KILLAREAS[i].getUnityComponent("RectTransform") : null;
      KILLAREA_BASE_ROT.push(r ? r.unityProp.localRotation : null);
    }
    killAreasReady = true;
    applyKillAreas();
    return true;
  } catch (e) {
    return false;
  }
}
tryInitKillAreas();


//残りタスク////////////////////////////////////////////////////////////////////////////////////////
let taskRemainImage = null;
let taskRemainRect = null;
///////////////////////////////////////////////////////////////////////////////////////////////////


let voteButtonsRoot = null;
let voteButtons = [];
let skipButton = null, skipRect = null, skipImage = null, skipOriginalPos = null;
let killButtonObj = null, killButton = null, killRect = null, killImage = null, killOriginalPos = null;
let killCooldownObject = null;
let buttonsReady = false;

function tryInitButtons() {
  try {
    const root = _.playerLocalObject("voteButtons");
    if (!root) return false;

    const builtButtons = [];
    for (let i = 0; i < MAX_VOTE_BUTTONS; i++) {
      const buttonObj = root.findObject("voteButton" + i);
      if (!buttonObj) return false;
      const button = buttonObj.getUnityComponent("Button");
      const labelObj = buttonObj.findObject("Text (Legacy)");
      if (!labelObj) return false;
      const label = labelObj.getUnityComponent("Text");
      const rect = buttonObj.getUnityComponent("RectTransform");
      const image = buttonObj.getUnityComponent("Image");
      const originalPos = rect.unityProp.anchoredPosition;
      builtButtons.push({ button, label, rect, image, originalPos, targetId: null });
    }

    const skipButtonObj = root.findObject("voteSkipButton");
    if (!skipButtonObj) return false;

    const killObj = _.playerLocalObject("killButton");
    const cooldownObj = _.playerLocalObject("killCooldown");
    if (!killObj || !cooldownObj) return false;

    const remainObj = _.playerLocalObject("taskRemainBar");
    if (!remainObj) return false;

    voteButtonsRoot = root;
    voteButtons = builtButtons;
    skipButton = skipButtonObj.getUnityComponent("Button");
    skipRect = skipButtonObj.getUnityComponent("RectTransform");
    skipImage = skipButtonObj.getUnityComponent("Image");
    skipOriginalPos = skipRect.unityProp.anchoredPosition;

    killButtonObj = killObj;
    killButton = killObj.getUnityComponent("Button");
    killRect = killObj.getUnityComponent("RectTransform");
    killImage = killObj.getUnityComponent("Image");
    killOriginalPos = killRect.unityProp.anchoredPosition;

    killCooldownObject = cooldownObj.getUnityComponent("Text");
    killCooldownObject.unityProp.text = "";
    killCooldownObject.unityProp.raycastTarget = false;

    taskRemainImage = remainObj.getUnityComponent("Image");
    taskRemainRect = remainObj.getUnityComponent("RectTransform");
    setRaycastTarget(taskRemainImage, false);
    setTaskRemainVisible(false);

    for (let i = 0; i < voteButtons.length; i++) {
      const entry = voteButtons[i];
      entry.button.onClick(isDown => {
        if (!isDown) return;
        if (entry.targetId === null) return;
        _.sendTo(gameManagerId, "vote", entry.targetId);
        setVoteButtonsVisible(false);
      });
    }
    skipButton.onClick(isDown => {
      if (!isDown) return;
      _.sendTo(gameManagerId, "vote", "skip");
      setVoteButtonsVisible(false);
    });
    killButton.onClick(isDown => {
      if (!isDown) return;
      if (role !== "imposter") return;
      _.sendTo(gameManagerId, "requestKill", null);
    });

    setVoteButtonsVisible(false);
    setKillButtonVisible(role === "imposter");
    return true;
  } catch (e) {
    return false;
  }
}

// ===== サボタージュ(Player Local UI) =====
// ワールドに入った直後はUIが読み込み途中のことがあるので、見つかるまで回数制限なしで試し続ける
// (最初の約5秒は毎フレーム、その後は0.5秒おき)
function trySabotageUi() {
  if (sabotageUiReady) return true;
  sabotageTries++;
  try {
    const names = ["sabotageBlackoutButton", "sabotageReactorButton", "sabotageText", "blackoutOverlay"];
    const objs = names.map(n => _.playerLocalObject(n));
    for (let i = 0; i < names.length; i++) {
      if (!objs[i]) return false;
    }
    const bObj = objs[0], rObj = objs[1], tObj = objs[2], oObj = objs[3];

    const make = (obj, defaultPos) => {
      const rect = obj.getUnityComponent("RectTransform");
      const button = obj.getUnityComponent("Button");
      const image = obj.getUnityComponent("Image");
      if (!rect || !button || !image) return null;
      return {
        button: button,
        image: image,
        rect: rect,
        originalPos: (rect.unityProp.anchoredPosition.x > -50000) ? rect.unityProp.anchoredPosition : defaultPos
      };
    };
    sabBlackoutBtn = make(bObj, SAB_BLACKOUT_DEFAULT_POS);
    sabReactorBtn = make(rObj, SAB_REACTOR_DEFAULT_POS);
    if (!sabBlackoutBtn || !sabReactorBtn) return false;

    sabotageText = tObj.getUnityComponent("Text");
    sabotageText.unityProp.text = "";
    sabotageText.unityProp.raycastTarget = false;
    sabotageOverlayRect = oObj.getUnityComponent("RectTransform");
    sabotageOverlayImage = oObj.getUnityComponent("Image");
    setRaycastTarget(sabotageOverlayImage, false);

    sabBlackoutBtn.button.onClick(isDown => {
      if (!isDown || role !== "imposter") return;
      _.sendTo(gameManagerId, "requestSabotage", "blackout");
    });
    sabReactorBtn.button.onClick(isDown => {
      if (!isDown || role !== "imposter") return;
      _.sendTo(gameManagerId, "requestSabotage", "reactor");
    });

    sabotageUiReady = true;
    applySabotageUi();
    return true;
  } catch (e) {
    return false;
  }
}

function tryInitArrow() {
  if (arrowReady) return true;
  arrowTries++;
  try {
    const aObj = _.playerLocalObject("blackoutArrow");
    const tObj = _.playerLocalObject("blackoutArrowText");
    if (!aObj || !tObj) return false;
    arrowRect = aObj.getUnityComponent("RectTransform");
    arrowImage = aObj.getUnityComponent("Image");
    arrowText = tObj.getUnityComponent("Text");
    if (!arrowRect || !arrowText) return false;
    setRaycastTarget(arrowImage, false);
    arrowText.unityProp.raycastTarget = false;
    arrowText.unityProp.text = "";
    arrowRect.unityProp.localScale = HIDDEN_SCALE;
    arrowReady = true;
    return true;
  } catch (e) {
    return false;
  }
}

// 停電中で、クルーのときだけ、矢印を出す
function arrowWanted() {
  const a = sabotageActive;
  return !!(a && a.type === "blackout" && role === "crew" && BLACKOUT_TARGETS.length > 0);
}

function applyArrow() {
  if (!arrowReady) return;
  if (!arrowWanted()) {
    arrowRect.unityProp.localScale = HIDDEN_SCALE;
    arrowText.unityProp.text = "";
  } else {
    arrowRect.unityProp.localScale = SHOWN_SCALE;
  }
}

// 毎フレーム: 一番近い配電盤の方向に、矢印を回す
function updateArrow() {
  if (!arrowReady || !arrowWanted()) return;
  const pos = _.getPosition();
  const rot = _.getRotation();
  if (!pos || !rot) return;

  let best = null, bestDist = Infinity;
  for (const t of BLACKOUT_TARGETS) {
    const dx = t.x - pos.x, dz = t.z - pos.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < bestDist) { bestDist = d; best = { dx: dx, dz: dz }; }
  }
  if (!best) return;

  const forward = new Vector3(0, 0, 1).applyQuaternion(rot);
  const yaw = Math.atan2(forward.x, forward.z) * 180 / Math.PI;      // 自分の向き
  const bearing = Math.atan2(best.dx, best.dz) * 180 / Math.PI;      // 配電盤の方角
  let delta = bearing - yaw;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  // 右にあるときは、矢印を右(時計回り)に傾ける
  arrowRect.unityProp.localRotation = new Quaternion().setFromEulerAngles(new Vector3(0, 0, -delta));
  arrowText.unityProp.text = "配電盤 " + Math.round(bestDist) + "m";
}

function applySabotageUi() {
  applyArrow();
  if (!sabotageUiReady) return;
  const visible = sabotageButtonsWanted;
  for (const b of [sabBlackoutBtn, sabReactorBtn]) {
    b.button.unityProp.enabled = visible;
    b.button.unityProp.interactable = visible && sabotageReady;
    setRaycastTarget(b.image, visible);
    b.rect.unityProp.localScale = visible ? SHOWN_SCALE : HIDDEN_SCALE;
    // 隠すときは、位置は動かさず、大きさ0で隠す(位置を飛ばすと、次のスクリプトが元の位置を見失うため)
    if (visible) b.rect.unityProp.anchoredPosition = b.originalPos;
  }
  const a = sabotageActive;
  let text = "";
  if (a) {
    text = a.type === "blackout"
      ? "停電"
      : "リアクター\nあと " + a.seconds + "秒";
  }
  sabotageText.unityProp.text = text;
  sabotageOverlayRect.unityProp.localScale = (a && a.type === "blackout" && role === "crew") ? SHOWN_SCALE : HIDDEN_SCALE;
}

function setSabotageButtonsVisible(visible) {
  sabotageButtonsWanted = visible;
  applySabotageUi();
}

function clearSabotageUi() {
  sabotageActive = null;
  sabotageReady = false;
  applySabotageUi();
}

trySabotageUi();
tryInitArrow();
buttonsReady = tryInitButtons();

_.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "assignRoles": // from gamemanager. arg: "imposter" or "crew"
      _.cameraHandle.setPerspectiveSwitchingLocked(true);
      _.cameraHandle.switchToFirstPersonView();
      role = arg;
      specialRole = ""; // 新しいゲームでは特殊役職をリセット

      _.setMoveSpeedRate(GAME_MOVE_SPEED_RATE);
      assignRolesObject.unityProp.text = "あなたは" + roleName(role);
      displayCount = 5;

      setKillButtonVisible(role === "imposter");
      setTaskRemainVisible(true);
      break;

    case "assignSpecialRole":
      specialRole = arg;

      // 役職発表中なら表示を更新
      if (displayCount >= 0) {
        assignRolesObject.unityProp.text = "あなたは" + displayRoleName();
      }
      break;

    case "start":
      _.sendTo(sender, "role", role);
      break;

    case "showKillArea":
      desiredKillArea = arg;
      applyKillAreas();
      break;

    case "hideKillArea":
      desiredKillArea = -1;
      applyKillAreas();
      break;

    case "kill": // from gamemanager. 
      clearSabotageUi();
      _.cameraHandle.setPerspectiveSwitchingLocked(false);
      _.setMoveSpeedRate(NORMAL_MOVE_SPEED_RATE);
      _.setPosition(WAITING_ROOM_POSITION);

      role = "";
      specialRole = "";
      assignRolesObject.unityProp.text = "";
      roleObject.unityProp.text = "";
      remainObject.unityProp.text = "";
      meetingObject.unityProp.text = "";
      
      setVoteButtonsVisible(false);
      setKillButtonVisible(false);
      setTaskRemainVisible(false);
      killCooldownLeft = -1;
      if (killCooldownObject) killCooldownObject.unityProp.text = "";
      setPhaseTimer(-1);
      break;

    case "killCooldownStart": // from KillSensor.
      killCooldownLeft = arg;
      if (killButton) killButton.unityProp.interactable = false;
      break;

    case "meetingStart":
      sabotageActive = null; applySabotageUi();
      meetingObject.unityProp.text =
        (arg.corpseName
          ? arg.reporterName + " が " + arg.corpseName + " の遺体を発見しました"
          : arg.reporterName + " が緊急会議を招集しました")
        + "\n会議中…";
      resultObject.unityProp.text = "";
      resultDisplayCount = -1;
      setKillButtonVisible(false);
      setPhaseTimer(arg.duration);
      break;

    case "votingStart": // from gamemanager. arg.candidates: { id, name } arg.duration: 会議時間
      meetingObject.unityProp.text = "投票してください";
      setupVoteButtons(arg.candidates);
      setKillButtonVisible(false);
      setPhaseTimer(arg.duration);
      break;

    case "sabotageStart":
      sabotageActive = { type: arg.type, seconds: arg.seconds };
      applySabotageUi();
      break;

    case "sabotageTime":
      if (sabotageActive) {
        sabotageActive.seconds = arg;
        applySabotageUi();
      }
      break;

    case "sabotageEnd":
      sabotageActive = null;
      applySabotageUi();
      break;

    case "sabotageReady":
      sabotageReady = arg;
      applySabotageUi();
      break;

    case "taskStart":
      if (role === "imposter") {
        _.sendTo(sender, "notCrew", true);
        break;
      } else {
        _.sendTo(sender, "notCrew", false);
      }
      break;

    case "taskList":
      remainObject.unityProp.text = arg.text;
      break;

    case "taskRemain": // arg: 完了したタスクのパーセント(0~1)
      if (taskRemainImage) taskRemainImage.unityProp.fillAmount = arg;
      break;

    case "votingResult": // from gamemanager. arg.ejectedName: 追放されたプレイヤーの名前, arg.ejectedRole: 同じく役職, arg.wasEjected: 自身が追放されたか
      setVoteButtonsVisible(false);
      meetingObject.unityProp.text = "";
      resultObject.unityProp.text = arg.ejectedName
        ? arg.ejectedName + " が追放されました（" + (arg.ejectedRole === "imposter" ? "インポスターだった" : "クルーだった") + "）"
        : "同数のため、誰も追放されませんでした";
      resultDisplayCount = RESULT_DISPLAY_TIME;
      setPhaseTimer(-1);

      if (arg.wasEjected) {
        clearSabotageUi();
        _.setMoveSpeedRate(NORMAL_MOVE_SPEED_RATE);
        role = "";
        specialRole = "";
        roleObject.unityProp.text = "";
        remainObject.unityProp.text = "";
        resumeKillButtonAfterResult = false;
        setKillButtonVisible(false);
        setTaskRemainVisible(false);
        desiredKillArea = -1; applyKillAreas();
      } else {
        resumeKillButtonAfterResult = true;
      }
      break;

    case "gameEnd":
      clearSabotageUi();
      _.cameraHandle.setPerspectiveSwitchingLocked(false);
      if(!arg.wasDead) _.setMoveSpeedRate(NORMAL_MOVE_SPEED_RATE);
      setVoteButtonsVisible(false);
      meetingObject.unityProp.text = "";
      roleObject.unityProp.text = "";
      remainObject.unityProp.text = "";
      resultObject.unityProp.text =
        arg.winner === "中止"
        ? "過半数が同意したので中止しました"
        : (arg.winner === "imposter" ? "インポスター" : "クルー") + "の勝利！";
      resultDisplayCount = RESULT_DISPLAY_TIME;
      resumeKillButtonAfterResult = false;
      setKillButtonVisible(false);
      setTaskRemainVisible(false);
      desiredKillArea = -1; applyKillAreas();
      killCooldownLeft = -1;
      if (killCooldownObject) killCooldownObject.unityProp.text = "";
      setPhaseTimer(-1);
      break;
  }
});

function setupVoteButtons(candidates) {
  if (!buttonsReady) return;
  for (let i = 0; i < voteButtons.length; i++) {
    const entry = voteButtons[i];
    if (i < candidates.length) {
      const candidate = candidates[i];
      entry.targetId = candidate.id;
      entry.label.unityProp.text = candidate.name;
      entry.button.unityProp.interactable = true;
      entry.button.unityProp.enabled = true;
      setRaycastTarget(entry.image, true);
      setRaycastTarget(entry.label, true);
      entry.rect.unityProp.localScale = SHOWN_SCALE;
      entry.rect.unityProp.anchoredPosition = entry.originalPos;
    } else {
      entry.targetId = null;
      entry.button.unityProp.interactable = false;
      entry.button.unityProp.enabled = false;
      setRaycastTarget(entry.image, false);
      setRaycastTarget(entry.label, false);
      entry.rect.unityProp.localScale = HIDDEN_SCALE;
      entry.rect.unityProp.anchoredPosition = OFFSCREEN_POS;
    }
  }
  skipButton.unityProp.interactable = true;
  skipButton.unityProp.enabled = true;
  setRaycastTarget(skipImage, true);
  skipRect.unityProp.localScale = SHOWN_SCALE;
  skipRect.unityProp.anchoredPosition = skipOriginalPos;
}

function setPhaseTimer(duration) {
  phaseTimeLeft = duration;
  timerObject.unityProp.text = duration >= 0 ? Math.ceil(duration) + "秒" : "";
}

function setVoteButtonsVisible(visible) {
  if (!buttonsReady) return;
  const scale = visible ? SHOWN_SCALE : HIDDEN_SCALE;
  for (const entry of voteButtons) {
    entry.button.unityProp.interactable = visible;
    entry.button.unityProp.enabled = visible;
    setRaycastTarget(entry.image, visible);
    setRaycastTarget(entry.label, visible);
    entry.rect.unityProp.localScale = scale;
    entry.rect.unityProp.anchoredPosition = visible ? entry.originalPos : OFFSCREEN_POS;
  }
  skipButton.unityProp.interactable = visible;
  skipButton.unityProp.enabled = visible;
  setRaycastTarget(skipImage, visible);
  skipRect.unityProp.localScale = scale;
  skipRect.unityProp.anchoredPosition = visible ? skipOriginalPos : OFFSCREEN_POS;
}

function setKillButtonVisible(visible) {
  setSabotageButtonsVisible(visible);
  if (!buttonsReady) return;
  killButtonShown = visible;
  killButton.unityProp.enabled = visible;
  setRaycastTarget(killImage, visible);
  killRect.unityProp.localScale = visible ? SHOWN_SCALE : HIDDEN_SCALE;
  killRect.unityProp.anchoredPosition = visible ? killOriginalPos : OFFSCREEN_POS;
  killButton.unityProp.interactable = visible && killCooldownLeft <= 0;
  if (!visible) killCooldownObject.unityProp.text = "";
}

function setTaskRemainVisible(visible) {
  if (!taskRemainRect) return;
  taskRemainRect.unityProp.localScale = visible ? SHOWN_SCALE : HIDDEN_SCALE;
}

_.onFrame((deltaTime) => {
  if (!buttonsReady) {
    buttonsReady = tryInitButtons();
  }
  if (!killAreasReady) {
    tryInitKillAreas();
  }
  if (!sabotageUiReady) {
    if (sabotageTries < 300) {
      trySabotageUi();
    } else {
      sabotageRetryWait -= deltaTime;
      if (sabotageRetryWait <= 0) {
        sabotageRetryWait = 0.5;
        trySabotageUi();
      }
    }
  }
  if (!arrowReady) {
    arrowRetryWait -= deltaTime;
    if (arrowRetryWait <= 0) {
      arrowRetryWait = arrowTries < 300 ? 0 : 0.5;
      tryInitArrow();
    }
  }
  updateArrow();
  if (desiredKillArea != -1) {
    const rect = KILLAREAS[desiredKillArea] ? KILLAREAS[desiredKillArea].getUnityComponent("RectTransform") : null;
    if (rect) {
      const pos = _.getPosition();
      const rot = _.getRotation();
      if (pos) {
        if (rot) {
          const forward = new Vector3(0, 0, 1).applyQuaternion(rot);
          forward.y = 0;
          if (forward.lengthSq() > 0.0001) {
            forward.normalize();
            pos.add(forward.clone().multiplyScalar(FORWARD_OFFSET));
            const yaw = Math.atan2(forward.x, forward.z) * 180 / Math.PI;
            const yawQ = new Quaternion().setFromEulerAngles(new Vector3(0, yaw, 0));
            const base = KILLAREA_BASE_ROT[desiredKillArea];
            rect.unityProp.localRotation = base ? yawQ.multiply(base) : yawQ;
          }
        }
        pos.y += 0.02;
        rect.unityProp.localPosition = pos;
      }
    }
  }

  if (displayCount >= 0) {
    displayCount -= deltaTime;
    if (displayCount <= 0) {
      displayCount = -1;
      assignRolesObject.unityProp.text = "";
      roleObject.unityProp.text = displayRoleName();
    }
  }

  if (phaseTimeLeft >= 0) {
    phaseTimeLeft -= deltaTime;
    if (phaseTimeLeft <= 0) {
      phaseTimeLeft = 0;
    }
    timerObject.unityProp.text = Math.ceil(phaseTimeLeft) + "秒";
  }

  if (resultDisplayCount >= 0) {
    resultDisplayCount -= deltaTime;
    if (resultDisplayCount <= 0) {
      resultDisplayCount = -1;
      resultObject.unityProp.text = "";
      if (resumeKillButtonAfterResult) {
        resumeKillButtonAfterResult = false;
        setKillButtonVisible(role === "imposter");
      }
    }
  }

  if (killCooldownLeft >= 0 && killCooldownObject) {
    killCooldownLeft -= deltaTime;
    if (killCooldownLeft <= 0) {
      killCooldownLeft = -1;
      killCooldownObject.unityProp.text = "";
      if (killButton) killButton.unityProp.interactable = killButtonShown;
    } else {
      killCooldownObject.unityProp.text = Math.ceil(killCooldownLeft) + "秒";
    }
  }
});