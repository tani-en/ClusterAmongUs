const TASK_STEPS = 6;
const TASK_ID = "plants";

const CHECK_INTERVAL = 0.2;  // 判定する間隔(秒)

// ===== 難易度の調整 =====
const WATER_MAX = 10;        // じょうろに入る水の量(注ぎ続けられる秒数)
const REFILL_SPEED = 1.2;    // 蛇口に重なっている間の補充速度(1秒で何秒ぶん増えるか)。空→満タンは WATER_MAX / これ 秒
const NEED_MIN = 1.5;        // 植物が必要とする水の量の最小(注ぐ秒数)。植物ごと・プレイヤーごとにランダム
const NEED_MAX = 3.5;        // 同じく最大
const MESSAGE_SECONDS = 2;

const PLANTS = [$.worldItemReference("plant"), $.worldItemReference("plant1"), $.worldItemReference("plant2"), $.worldItemReference("plant3"), $.worldItemReference("plant4"), $.worldItemReference("plant5")];
const TAP = $.worldItemReference("tap");
const water = $.subNode("water");
const info = $.subNode("info");


$.onStart(() => {
  water.setEnabled(false);
  $.state.player = null;
  $.state.timer = 0;
  $.state.data = {};           // { プレイヤーID: { water, needs[], given[], done[], sent } }
  $.state.msg = "";
  $.state.msgLeft = 0;
  $.state.lastText = null;
});


$.onUse((isDown, player) => {
  if (isDown) {
    const d = getData(player, $.state.data);
    if (d.water <= 0) return;
    water.setEnabled(true);
    $.state.player = player;
  } else {
    water.setEnabled(false);
    $.state.player = null;
  }
});


$.onReceive((messageType) => {
  switch (messageType) {
    case "start": // from GM.
      $.setPosition(new Vector3(3, -5, 0));
      $.setRotation(Quaternion(-0.707106829, 0, 0, 0.707106709));
      $.state.data = {};
      $.state.msg = "";
      break;

  }
});


// プレイヤーごとの記録(なければ、必要な水の量をランダムに決めて作る)
function getData(player, all) {
  let d = all[player.id];
  if (!d) {
    const needs = [], given = [], done = [];
    for (let i = 0; i < PLANTS.length; i++) {
      needs.push(NEED_MIN + Math.random() * (NEED_MAX - NEED_MIN));
      given.push(0);
      done.push(false);
    }
    d = { water: WATER_MAX, needs: needs, given: given, done: done, sent: false };
    all[player.id] = d;
  }
  return d;
}


// 植物に必要な量まで注げたら、その植物は完了
function completePlant(player, idx, d) {
  d.done[idx] = true;
  $.state.msg = "完了";
  $.state.msgLeft = MESSAGE_SECONDS;
  const count = d.done.filter(x => x).length;
  if (count >= TASK_STEPS && !d.sent) {
    d.sent = true;
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}


function bar(ratio, len) {
  const n = Math.max(0, Math.min(len, Math.round(ratio * len)));
  return "■".repeat(n) + "□".repeat(len - n);
}


$.onUpdate(deltaTime => {
  if ($.state.msgLeft > 0) $.state.msgLeft -= deltaTime;

  const timer = $.state.timer + deltaTime;
  if (timer < CHECK_INTERVAL) { $.state.timer = timer; return; }
  $.state.timer = 0;
  const dt = timer;

  const all = $.state.data;

  // 誰の分として数えるか
  let player = $.state.player;
  if (!player) player = $.getGrabbingPlayer();
  if (!player) { setInfo(""); return; }

  const d = getData(player, all);
  const pouring = !!$.state.player && d.water > 0;

  // いま重なっているアイテム
  const overlaps = $.getOverlaps();
  const ids = new Set(
    overlaps.map(o => o.handle).filter(h => h?.type === "item").map(h => h.id)
  );

  // 水を注ぐ対象(まだ終わっていない最初の植物)
  let target = -1;
  if (pouring) {
    for (let i = 0; i < PLANTS.length; i++) {
      if (!d.done[i] && ids.has(PLANTS[i].id)) { target = i; break; }
    }
  }

  // 水を減らす
  if (pouring) {
    d.water -= dt;
    if (d.water <= 0) {
      d.water = 0;
      water.setEnabled(false);
      $.state.player = null;
      $.state.msg = "水がなくなった";
      $.state.msgLeft = MESSAGE_SECONDS;
    }
  }

  // 植物に水を足す。必要な量に届いたら完了
  if (target >= 0) {
    d.given[target] += dt;
    if (d.given[target] >= d.needs[target]) {
      d.given[target] = d.needs[target];
      completePlant(player, target, d);
      target = -1;
    }
  }

  // 蛇口にかぶさっていて、注いでいないなら、少しずつ補充
  if (!pouring && TAP && d.water < WATER_MAX && ids.has(TAP.id)) {
    d.water = Math.min(WATER_MAX, d.water + REFILL_SPEED * dt);
  }

  $.state.data = all;   // 中身を変えたので、代入し直して反映する

  // 表示
  const doneCount = d.done.filter(x => x).length;
  let text = "水 " + bar(d.water / WATER_MAX, 10) + "\n水やり " + doneCount + "/" + TASK_STEPS;
  if (target >= 0) {
    const r = d.given[target] / d.needs[target];
    text += "\n" + bar(r, 10) + " " + Math.floor(r * 100) + "%";
  }
  if ($.state.msgLeft > 0) text += "\n" + $.state.msg;
  setInfo(text);
});


function setInfo(text) {
  if ($.state.lastText === text) return;
  $.state.lastText = text;
  try { info.setText(text); } catch (e) {}
}