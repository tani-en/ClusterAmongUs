const LIGHTBULBLIGHTS = [$.subNode("LightBulblight"), $.subNode("LightBulblight (1)"), $.subNode("LightBulblight (2)")];
const LIGHTBULBDARKS  = [$.subNode("LightBulbdark"),  $.subNode("LightBulbdark (1)"),  $.subNode("LightBulbdark (2)")];

const TASK_ID = "light";    // GameManager.js の TASK_DEFS の id
const STEP = 0;
const LIGHT_SECONDS = 3;    // 完了したとき、電気を光らせておく秒数


function setBulbLit(lit) {
  for (const node of LIGHTBULBLIGHTS) node.setEnabled(lit);
  for (const node of LIGHTBULBDARKS) node.setEnabled(!lit);
}

$.onStart(() => {
  $.state.stateTask   = {};  // { プレイヤーID: これまでに押したレバーの番号の並び(正しく押せている分だけ) }
  $.state.taskOrders  = {};  // { プレイヤーID: 押すべき順番 }  GameManagerが"start"で教えてくれる(クルーの分だけ)
  $.state.done        = [];  // 電球タスクを終えたプレイヤーのid
  $.state.lightRemain = 0;   // 電気が光っている残り秒数
  setBulbLit(false);
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "lever": {
      const player = arg && arg.player;
      if (!player) break;

      const order = $.state.taskOrders[player.id];
      if (!order) break;                              // この人の担当ではない(インポスターなど)ので無視する
      if ($.state.done.includes(player.id)) break;    // もう終わっている

      const stateTask = $.state.stateTask;
      const pressed = stateTask[player.id] ?? [];

      // 押すたびに判定する: 今回が「何番目の押下か」に当たる正解と比べる
      const expected = order[pressed.length];
      if (arg.lever === expected) {
        // 正解: 記録に足す
        pressed.push(arg.lever);
        stateTask[player.id] = pressed;
        $.state.stateTask = stateTask;                // 中身を変えたので、代入し直して反映する

        // タスク一覧の表示用に、いまの進み具合をGameManagerへ知らせる
        notifyProgress(player, pressed.length);

        // 最後まで正しく押せたら完了
        if (pressed.length === order.length) completeTask(player);
        sender.send("result", true);
      } else {
        // 間違い: すぐに最初からやり直し
        stateTask[player.id] = [];
        $.state.stateTask = stateTask;
        notifyProgress(player, 0); // タスク一覧の表示も最初に戻す
        sender.send("result", true);
      }
      break;
    }

    case "start": {
      // 新しいゲームの開始。今回のクルーそれぞれの押す順番を受け取り、記録をまっさらにする
      $.state.taskOrders = arg.taskOrders;
      const stateTask = {};
      for (const playerId in arg.taskOrders) stateTask[playerId] = [];
      $.state.stateTask = stateTask;
      $.state.done = [];
      $.state.lightRemain = 0;
      setBulbLit(false);
      break;
    }
  }
});


// いま何個、正しい順番で押せているかをGameManagerへ知らせる(タスク一覧の表示用)
function notifyProgress(player, count){
  $.worldItemReference("gameManager").send("leverProgress", {
    taskId: TASK_ID,
    player: player,
    count: count
  });
}

// 順番どおりに最後まで押せたときの処理
function completeTask(player){
  $.state.done = [...$.state.done, player.id];
  $.worldItemReference("gameManager").send("taskStep", {
    taskId: TASK_ID,
    step: STEP,
    player: player
  });
  // 本当に終えたクルーがいるときだけ光る(他の人から見えるので、本物の証明になる)
  $.state.lightRemain = LIGHT_SECONDS; // 光っている最中に別の人が終えたら、数え直す
  setBulbLit(true);
}

$.onUpdate(deltaTime => {
  const remain = $.state.lightRemain;
  if (remain <= 0) return;

  const next = remain - deltaTime;
  if (next <= 0) {
    $.state.lightRemain = 0;
    setBulbLit(false);
  } else {
    $.state.lightRemain = next;
  }
});