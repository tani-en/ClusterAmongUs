const COAL_PER_BOILER = 3; // 1つのボイラーに入れる石炭の数
const MAX_COALS = 5;       // 同時に出しておける石炭の数
const TASK_ID = "power";   // GameManager.js の TASK_DEFS の id(発電の1工程目が石炭を入れる作業)

const Boilers    = [$.worldItemReference("boiler"), $.worldItemReference("boiler1"), $.worldItemReference("boiler2")];
const COALTEMPLATE = new WorldItemTemplateId("coal");


$.onStart(() => {
  $.state.Coal     = [];
  $.state.stateTask = {}; // { プレイヤーID: [ボイラー0に入れた数, ボイラー1, ボイラー2] }
  $.state.done = [];      // タスクを終えたプレイヤーのid
});


$.onInteract(() => {
  let Coal =  $.state.Coal.filter(coal => coal.exists());
  if (Coal.length < MAX_COALS){
    const markerPosition = $.getPosition();
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    const coalHandle = $.createItem(COALTEMPLATE, markerPosition, markerRotation);
    Coal.push(coalHandle);
    coalHandle.send("boiers", Boilers);
  }
  $.state.Coal = Coal;
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteCoal": { // from Coal.js. arg: { player, boiler: ボイラーの番号 }
      let Coal = $.state.Coal;
      if (!Coal.some(coal => coal.id === sender.id)) break;
      Coal = Coal.filter(coal => coal.id != sender.id);
      $.state.Coal = Coal;
      if (arg && arg.player) taskProgress(arg.player, arg.boiler);
      break;
    }

    case "start":
      $.state.Coal.forEach(coal => {
        if (coal.exists()) coal.send("start", null);
      });
      $.state.Coal     = [];
      $.state.stateTask = {};
      $.state.done = [];
      break;
  }
});


function taskProgress(player, boiler){
  if (!Number.isInteger(boiler) || boiler < 0 || boiler >= Boilers.length) return;
  if ($.state.done.includes(player.id)) return;

  const stateTask = $.state.stateTask;
  const counts = stateTask[player.id] ? [...stateTask[player.id]] : Boilers.map(() => 0);

  if (counts[boiler] >= COAL_PER_BOILER) return; // そのボイラーは、もう満タン。数えない
  counts[boiler] += 1;
  stateTask[player.id] = counts;
  $.state.stateTask = stateTask;

  // タスク一覧に出す、ボイラーごとの入れた数をGameManagerへ知らせる
  $.worldItemReference("gameManager").send("coalProgress", {
    taskId: TASK_ID,
    player: player,
    count: counts
  });

  // すべてのボイラーが満タンになったら完了
  if (counts.every(c => c >= COAL_PER_BOILER)) {
    $.state.done = [...$.state.done, player.id];
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}