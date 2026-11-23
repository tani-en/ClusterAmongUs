// サイコロのタスク。つかんで投げて、止まったときの上の面が、担当のプレイヤーに決められた目と同じなら完了。
// アイテムには、Grabbable Item、Rigidbody、Collider が必要(つかめて、転がること)。
//
// 設定:
//   子に、面の目印の空オブジェクト face1〜face6 を置く(下の「面の目印」を参照)
//   World Item Reference List に gameManager、diceTray(サイコロを投げ込むトレイ。Item と Scriptable Item を付けたアイテム。中身が空のスクリプトでもよい)
//   GameManager の World Item Reference List に dice(このアイテム)
//   子に TextView(Text)があれば、出た目を表示する(なくても動く)。
//
// 流れ:
//   GameManager → ここ : "start" { targets: { プレイヤーID: 出す目(1〜6) } }
//   ここ → GameManager : "taskStep" { taskId, step, player }(出た目が、投げた人の目と同じとき)
//
// ・手から離れたあと、トレイ(diceTray)に触れたときだけ数える(トレイの外で止まったり、手で置いたりしても、無効)。
// ・止まった(SETTLE_SECONDS の間、ほとんど動かず、上の面も変わらない)ときに、結果を決める。
// ・斜めに止まったとき(どの面もはっきり上を向いていない)は、結果にしない。
// ・落ちて下に行き過ぎたら、最初の位置に戻す。

const TASK_ID = "dice";   // GameManager.js の TASK_DEFS の id
const STEP = 0;

const SETTLE_SPEED = 0.05;    // これ以下なら、止まっているとみなす[m/s]
const SETTLE_SECONDS = 1.0;   // 止まっている状態が続く秒数
const UP_THRESHOLD = 0.9;     // 面の向きが、真上とどれだけ近ければ、「上を向いている」とするか(1が真上)
const FALL_LIMIT = 5;         // 最初の位置より、これだけ下に行ったら、戻す[m]
const RETURN_SECONDS = 3;     // 結果を見せてから、元の場所に戻すまでの秒数
const MAX_WATCH_SECONDS = 20; // 手から離れてから、止まらなかったとき(斜めで止まった、など)に、戻すまでの秒数

// 面の目印: サイコロの子に、空のオブジェクトを6つ置く。名前は face1〜face6(数字は、その面の目)。
// 各オブジェクトは、その目の面の中心に置く(面の少し内側)。
// 軸の向きに頼らず、「いま、どの目印がいちばん高いか」で、上の面を決める。
// (モデルの向きや、取り込み時の軸の変換が変わっても、目印は、見た目の面に付いてくるので、ずれない)
const FACE_NODES = [1, 2, 3, 4, 5, 6].map(n => ({ n: n, node: $.subNode("face" + n) }));

const GAMEMANAGER = $.worldItemReference("gameManager");
const TRAY = $.worldItemReference("diceTray");

$.onStart(() => {
  $.state.targets = {};      // { プレイヤーID: 出す目 }
  $.state.home = $.getPosition();
  $.state.homeRot = $.getRotation();
  $.state.player = null;     // 最後につかんだプレイヤー(=投げた人)
  $.state.grab = false;
  $.state.watching = false;  // 投げたあと、止まるのを待っているか
  $.state.touchedTray = false; // 手から離れたあと、トレイに触れたか
  $.state.settle = 0;        // 止まっている秒数
  $.state.lastFace = 0;
  $.state.lastPos = $.getPosition();
  $.state.watchTime = 0;     // 手から離れてからの経過秒数
  $.state.returnIn = -1;     // 元の場所に戻すまでの残り秒数(-1は、予定なし)
  showText("");
});

$.onGrab((isGrab, isLeftHand, player) => {
  $.state.grab = isGrab;
  if (isGrab) {
    $.state.player = player;
    $.state.watching = false;
    $.state.touchedTray = false;
    $.state.returnIn = -1; // 戻す前につかんだら、戻さない
    showText("");
  } else {
    // 手から離れた: 止まるのを待つ
    $.state.watching = true;
    $.state.touchedTray = false;
    $.state.settle = 0;
    $.state.lastFace = 0;
    $.state.watchTime = 0;
  }
});

// 手から離れたあとに、トレイに触れたかを記録する
$.onCollide(collision => {
  if ($.state.grab || !$.state.watching) return;
  const h = collision.handle;
  if (!h || h.type !== "item") return;
  if (h.id === TRAY.id) $.state.touchedTray = true;
});

$.onReceive((messageType, arg, sender) => {
  if (messageType !== "start") return; // from GameManager
  $.state.targets = (arg && arg.targets) ? arg.targets : {};
  $.state.player = null;
  $.state.watching = false;
  showText("");
  returnHome();
});

$.onUpdate(deltaTime => {
  if (deltaTime <= 0) return;
  const pos = $.getPosition();
  const last = $.state.lastPos;
  const speed = pos.clone().sub(last).length() / deltaTime;
  $.state.lastPos = pos;

  // 落ちすぎたら、最初の位置に戻す
  if (pos.y < $.state.home.y - FALL_LIMIT) {
    returnHome();
    return;
  }

  if ($.state.grab) return;

  // 結果を出したあと、少し見せてから、元の場所に戻す
  if ($.state.returnIn >= 0) {
    const left = $.state.returnIn - deltaTime;
    if (left <= 0) {
      $.state.returnIn = -1;
      returnHome();
      showText("");
    } else {
      $.state.returnIn = left;
    }
    return;
  }

  if (!$.state.watching) return;

  // いつまでも止まらないとき(斜めで止まった、など)は、戻す
  $.state.watchTime += deltaTime;
  if ($.state.watchTime >= MAX_WATCH_SECONDS) {
    $.state.watching = false;
    returnHome();
    return;
  }

  const face = topFace(); // 0なら、斜めで、どの面も上を向いていない
  if (speed < SETTLE_SPEED && face !== 0 && face === $.state.lastFace) {
    $.state.settle += deltaTime;
  } else {
    $.state.settle = 0;
  }
  $.state.lastFace = face;

  if ($.state.settle >= SETTLE_SECONDS) {
    $.state.watching = false;
    decide(face);
  }
});

// いま上を向いている面の目を返す。はっきり上を向いている面がなければ0。
// いちばん高い目印が、サイコロの中心から、ほぼ真上にあれば、その面が上。
function topFace() {
  const center = $.getPosition();
  let best = 0;
  let bestUp = UP_THRESHOLD;
  for (const f of FACE_NODES) {
    const p = f.node.getGlobalPosition();
    const offset = p.clone().sub(center);
    const len = offset.length();
    if (len < 0.0001) continue; // 目印が、中心と同じ位置にある(置き方の間違い)
    const up = offset.y / len; // 中心から見た、その面の向きの、真上方向の成分(1が真上)
    if (up >= bestUp) {
      bestUp = up;
      best = f.n;
    }
  }
  return best;
}

function decide(face) {
  const player = $.state.player;
  $.state.returnIn = RETURN_SECONDS; // 結果が出たら(無効のときも)、少ししたら元の場所に戻す
  if (!$.state.touchedTray) return;

  const target = player ? $.state.targets[player.id] : undefined;
  if (target === undefined) {
    showText("出た目: " + face);
    return;
  }
  if (face === target) {
    showText("出た目: " + face + "  当たり!");
    GAMEMANAGER.send("taskStep", { taskId: TASK_ID, step: STEP, player: player });
  } else {
    showText("出た目: " + face + "  (目標は " + target + ")");
  }
}

function returnHome() {
  $.setPosition($.state.home);
  $.setRotation($.state.homeRot);
  $.state.lastPos = $.state.home;
  $.state.watching = false;
  $.state.returnIn = -1;
}

function showText(text) {
  try {
    $.subNode("TextView").setText(text);
  } catch (e) {
    // 表示用の Text が無い場合は、何もしない
  }
}