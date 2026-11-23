const TASK_ID = "faucet";

const REOPEN_SECONDS = 5;    // 蛇口を閉めてから、水がまた出始めるまでの秒数

const water = $.subNode("water");

$.onStart(() => {
  water.setEnabled(true);
  $.state.closed = false;    // 蛇口が閉まっているか
  $.state.timer = 0;         // 閉めてから、あと何秒で水が出るか
});

$.onInteract(player => {
  water.setEnabled(false);   // 水を止める
  $.state.closed = true;
  $.state.timer = REOPEN_SECONDS;
  taskProgress(player);
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "start": // from GM. 新しいゲーム: 水を出し直す
      water.setEnabled(true);
      $.state.closed = false;
      $.state.timer = 0;
      break;
  }
});

$.onUpdate(deltaTime => {
  if (!$.state.closed) return;

  const timer = $.state.timer - deltaTime;
  if (timer <= 0) {
    water.setEnabled(true);  // 時間が経ったら、水がまた出る
    $.state.closed = false;
    $.state.timer = 0;
    return;
  }
  $.state.timer = timer;
});

function taskProgress(player) {
  $.worldItemReference("gameManager").send("taskStep", {
    taskId: TASK_ID,
    player: player
  });
}