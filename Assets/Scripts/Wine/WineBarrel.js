// ワイン室の樽。5つの樽に、同じスクリプトを付ける。触れるアイテム(Item、Scriptable Item、Collider)に付ける。
// 触る(1回目)→ 樽の下にグラスが出て、ワインが注がれ始める → もう一度触って止める。
// 止めたときの量が、目印の範囲に入っていれば成功(グラス1つぶん)。足りない/多いと失敗。入れすぎて溢れても失敗。
// 失敗したら、そのグラスは消えて、同じ樽で最初からやり直せる。
// 誰でも注げる(タスクの担当でなくても可)。数えるのは、WineManager が担当者だけ。
//
// 設定:
//   World Item Reference List に wineManager を入れる。
//   World Item Template List に "wine_glass"(WineGlass.js を付けたグラス)を登録する。

const MANAGER = $.worldItemReference("wineManager");
const GLASS_TEMPLATE = new WorldItemTemplateId("wine_glass");
const FLOWINGWINE = $.subNode("FlowingWine");

const GLASS_OFFSET_Y = -1.3;   // 樽の位置から見た、グラスを出す高さ(下向きがマイナス)
const GLASS_OFFSET_Z = -1.0;
const SPEED_MIN = 1.8;         // 1秒に注がれる量(グラスの「段」の数)。注ぐたびに、この範囲でランダムに決まる
const SPEED_MAX = 2.6;
const ACCEL = 0.8;            // 注いでいる間、1秒ごとに速くなる割合(0.25 = 1秒で25%増し)。0なら一定
const LEVELS = 8;              // グラスの段の数。これに達すると溢れる
const TARGET_MIN = 6.0;          // 成功の範囲(段の数・小数で判定): 6.0〜7.0。ちょうど1段ぶんの幅しかない
const TARGET_MAX = 7;
const RESULT_SECONDS = 2;      // 止めてから、結果を見せて、グラスを片付けるまでの秒数

$.onStart(() => {
  $.state.mode = "idle";   // idle / pouring / result
  $.state.pourer = null;   // いま注いでいるプレイヤー
  $.state.level = 0;       // 注がれた量(小数)
  $.state.speed = 0;       // このグラスの、注ぐ速さ
  $.state.elapsed = 0;     // 注ぎ始めてからの秒数
  $.state.shown = 0;       // グラスに見せている段の数
  $.state.glass = null;
  $.state.timer = 0;
  FLOWINGWINE.setEnabled(false);
});

$.onInteract((player) => {
  const mode = $.state.mode;

  if (mode === "idle") {
    const position = $.getPosition();
    position.y += GLASS_OFFSET_Y;
    position.z += GLASS_OFFSET_Z;
    $.state.glass = $.createItem(GLASS_TEMPLATE, position, $.getRotation());
    $.state.pourer = player;
    $.state.level = 0;
    $.state.shown = 0;
    $.state.speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    $.state.elapsed = 0;
    $.state.mode = "pouring";
    FLOWINGWINE.setEnabled(true);
    return;
  }

  if (mode === "pouring") {
    if (!$.state.pourer || $.state.pourer.id !== player.id) return; // 注いでいる本人だけが止められる
    finish(player);
  }
});

$.onUpdate(deltaTime => {
  if ($.state.mode === "pouring") {
    // 注いでいる人が、ワールドから出た場合は、片付ける
    const pourer = $.state.pourer;
    if (!pourer || !pourer.exists()) { reset(); return; }

    const elapsed = $.state.elapsed + deltaTime;
    $.state.elapsed = elapsed;
    const level = $.state.level + $.state.speed * (1 + ACCEL * elapsed) * deltaTime;
    $.state.level = level;
    const shown = Math.min(LEVELS, Math.floor(level));
    if (shown !== $.state.shown) {
      $.state.shown = shown;
      if ($.state.glass && $.state.glass.exists()) $.state.glass.send("level", shown);
    }
    if (level >= LEVELS) finish(pourer); // 溢れた(失敗)
    return;
  }

  if ($.state.mode === "result") {
    const timer = $.state.timer - deltaTime;
    if (timer <= 0) { reset(); return; }
    $.state.timer = timer;
  }
});

$.onReceive((messageType, arg, sender) => {
  if (messageType === "start") reset(); // from WineManager: 新しいゲーム
});

function finish(player) {
  const level = $.state.level;
  const ok = level >= TARGET_MIN && level <= TARGET_MAX;
  $.state.mode = "result";
  $.state.timer = RESULT_SECONDS;
  FLOWINGWINE.setEnabled(false);
  if (ok) MANAGER.send("glassDone", { player: player });
}

function reset() {
  if ($.state.glass && $.state.glass.exists()) $.state.glass.send("close", null);
  $.state.glass = null;
  $.state.pourer = null;
  $.state.level = 0;
  $.state.shown = 0;
  $.state.timer = 0;
  $.state.mode = "idle";
  FLOWINGWINE.setEnabled(false);
}