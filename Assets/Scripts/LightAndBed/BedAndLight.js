const TASK_STEPS = 4;
const TASK_ID = "lamps";
const STEP = 0;

const RESET_SECONDS = 5;

$.onStart(() => {
  $.state.stateTask = {};    // { プレイヤーID: interactした数 }
  $.state.resetTimers = {};  // { プレイヤーID: 記録を0に戻すまでの残り秒数 }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "interact":
      if (arg && arg.player) taskProgress(arg.player);
      break;

    case "start":
      $.state.stateTask = {};
      $.state.resetTimers = {};
      break;

  }
});


function taskProgress(player){
  const stateTask = $.state.stateTask;
  const count = (stateTask[player.id] ?? 0) + 1;
  stateTask[player.id] = count;
  $.state.stateTask = stateTask;

  // 1つ目のとき: この人の記録を RESET_SECONDS 秒後に0へ戻すタイマーを始める
  if (count === 1) {
    const timers = $.state.resetTimers;
    timers[player.id] = RESET_SECONDS;
    $.state.resetTimers = timers;
  }

  if (count === TASK_STEPS){
    // 終えたので、タイマーを止める(止めないと、完了後に記録が0へ戻ってしまう)
    const timers = $.state.resetTimers;
    delete timers[player.id];
    $.state.resetTimers = timers;

    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      step: STEP,
      player: player
    });
  }
}

// 動いているタイマーを進め、時間になった人の記録を0に戻す
$.onUpdate(deltaTime => {
  const timers = $.state.resetTimers;
  const ids = Object.keys(timers);
  if (ids.length === 0) return;

  const stateTask = $.state.stateTask;
  let resetAny = false;

  for (const id of ids) {
    timers[id] -= deltaTime;
    if (timers[id] <= 0) {
      stateTask[id] = 0;
      delete timers[id];
      resetAny = true;
    }
  }

  $.state.resetTimers = timers;
  if (resetAny) $.state.stateTask = stateTask;
});