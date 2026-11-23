// ハンバーガーを作るタスクの、土台(下のパン)。下のパン(LowerBans)のアイテムに付ける。
// 材料(BurgerIngredient.js)が当たると "place" が届く。材料は、誰でも、自由な順番で積み上げられる。
// 正しい順番かどうかは、上のパン(upper)を載せたときに、まとめて検査する。
//
// 設定:
//   World Item Reference List に: gameManager、burgerBox0〜burgerBox4(材料の箱5つ)
//   GameManager の World Item Reference List に: burgerBase(この土台)
//   見た目の積み上がりは、子の layer0_steak などを出し入れして表す(Tools > Build Burger Stack で自動で作る)
//
// 流れ:
//   GameManager → ここ : "start" { taskOrders: { プレイヤーID: [材料の順番] } }  例: ["cheese","steak","tomato","cabbage","upper"]
//   材料 → ここ        : "place" { type, player }
//   ここ → GameManager : "taskStep" { taskId, step, player } (上のパンを載せたプレイヤーの順番と、積んだ順番が一致したとき)
//
// ・タスクが割り当てられていない人(インポスターなど)も、積み上げることはできる(検査と完了は、割り当てられた人だけ)。
// ・見た目の山は1つ。上のパンを載せると、山は閉じて、SHOW_SECONDS 秒そのまま見せてから、片付く。
// ・間違った順番だった場合は、完了にならずに、山が片付くだけ(最初からやり直し)。

const TASK_ID = "burger"; // GameManager.js の TASK_DEFS の id
const STEP = 0;           // 何番目の工程か(0始まり)

const SHOW_SECONDS = 3;   // 上のパンを載せてから、山を片付けるまでの秒数

const GAMEMANAGER = $.worldItemReference("gameManager");
const BOXES = [
  $.worldItemReference("burgerBox0"), $.worldItemReference("burgerBox1"),
  $.worldItemReference("burgerBox2"), $.worldItemReference("burgerBox3"),
  $.worldItemReference("burgerBox4"),
];

// 見た目の層の名前: layer{段}_{材料}。中身は0〜3段目(4種類)、上のパンは0〜4段目(積んだ数に合わせて、高さが変わる)。
const MIDDLE_TYPES = ["steak", "cheese", "cabbage", "tomato"];
const MIDDLE_SLOTS = 4;   // 上のパンの下に積める、中身の数の上限

$.onStart(() => {
  $.state.taskOrders = {}; // { プレイヤーID: [材料の順番] }
  $.state.done = [];       // 積み終えたプレイヤーのid
  $.state.stack = [];      // いま積まれている材料(下から順)
  $.state.closed = false;  // 上のパンを載せて、山が閉じているか
  $.state.timer = 0;       // 山が閉じてから、片付けるまでの残り秒数
  hideAllLayers();
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": { // from GameManager
      $.state.taskOrders = arg.taskOrders ?? {};
      $.state.done = [];
      clearStack();
      for (const box of BOXES) box.send("start", null); // 箱から出ていた材料を消す
      break;
    }

    case "place": { // from BurgerIngredient. arg: { type, player }
      if (!(sender instanceof ItemHandle)) break;
      const type = arg && arg.type;
      const player = arg && arg.player;
      if (!type || !player) break;
      if ($.state.closed) break; // 閉じている間は、積めない

      const stack = $.state.stack;

      if (type === "upper") {
        // 上のパン: 山を閉じて、載せたプレイヤーの順番と照らし合わせる
        const closedStack = [...stack, "upper"];
        $.state.stack = closedStack;
        $.state.closed = true;
        $.state.timer = SHOW_SECONDS;
        showStack(closedStack);
        judge(player, stack);
        break;
      }

      if (!MIDDLE_TYPES.includes(type)) break;
      if (stack.length >= MIDDLE_SLOTS) break; // これ以上は積めない(上のパンを載せる)
      const next = [...stack, type];
      $.state.stack = next;
      showStack(next);
      break;
    }
  }
});

$.onUpdate(deltaTime => {
  if (!$.state.closed) return;
  const timer = $.state.timer - deltaTime;
  if (timer <= 0) {
    clearStack();
    return;
  }
  $.state.timer = timer;
});

// 上のパンを載せたプレイヤーに、割り当てられた順番と、積んだ中身(上のパンの下)が一致するか検査する
function judge(player, middle) {
  const order = $.state.taskOrders[player.id];
  if (!order) return; // 担当ではない(積むだけ)
  if ($.state.done.includes(player.id)) return;

  const expected = order.slice(0, -1); // 最後の upper を除いた、中身の順番
  const ok = middle.length === expected.length && middle.every((type, i) => type === expected[i]);
  if (!ok) return; // 間違い。完了にならず、山が片付くだけ

  $.state.done = [...$.state.done, player.id];
  GAMEMANAGER.send("taskStep", { taskId: TASK_ID, step: STEP, player: player });
}

function clearStack() {
  $.state.stack = [];
  $.state.closed = false;
  $.state.timer = 0;
  hideAllLayers();
}

function layerName(slot, type) {
  return "layer" + slot + "_" + type;
}

function setLayer(slot, type, enabled) {
  try {
    $.subNode(layerName(slot, type)).setEnabled(enabled);
  } catch (e) {
    $.log("[ハンバーガー] 層が見つかりません: " + layerName(slot, type));
  }
}

function hideAllLayers() {
  for (let slot = 0; slot < MIDDLE_SLOTS; slot++) {
    for (const type of MIDDLE_TYPES) setLayer(slot, type, false);
  }
  for (let slot = 0; slot <= MIDDLE_SLOTS; slot++) setLayer(slot, "upper", false);
}

// 積まれている材料を、下から順に見せる
function showStack(stack) {
  hideAllLayers();
  stack.forEach((type, i) => setLayer(i, type, true));
}