const MAX_CHAIR = 4;
const TASK_ID = "chairs";

const ChairPoses    = [$.worldItemReference("chairPos"), $.worldItemReference("chairPos1"), $.worldItemReference("chairPos2"), $.worldItemReference("chairPos3")];
const CHAIRTEMPLATE = new WorldItemTemplateId("chair");


$.onStart(() => {
  $.state.chair     = [];
  $.state.stateTask = {};
  $.state.done = [];      // タスクを終えたプレイヤーのid
});


$.onInteract(() => {
  let chair =  $.state.chair.filter(chair => chair.exists());
  if (chair.length < MAX_CHAIR){
    const markerPosition = $.getPosition();
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    const chairHandle = $.createItem(CHAIRTEMPLATE, markerPosition, markerRotation);
    chair.push(chairHandle);
    chairHandle.send("chairPoses", ChairPoses);
  }
  $.state.chair = chair;
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteChair": { // from Chair.js. arg: { player, chairPos: chairPosの番号 }
      let chair = $.state.chair;
      if (!(sender instanceof ItemHandle)) break;
      if (!chair.some(chair => chair.id === sender.id)) break;
      chair = chair.filter(chair => chair.id != sender.id);
      $.state.chair = chair;
      if (arg && arg.player) taskProgress(arg.player, arg.chairPos);
      break;
    }

    case "start":
      ChairPoses.forEach(pos => pos.send("start", null)); // 置いてあるお皿の表示を戻す
      $.state.chair.forEach(chair => {
        if (chair.exists()) chair.send("start", null);
      });
      $.state.chair     = [];
      $.state.stateTask = {};
      $.state.done = [];
      break;
  }
});


function taskProgress(player, chairPos){
  if (!Number.isInteger(chairPos) || chairPos < 0 || chairPos >= ChairPoses.length) return;
  if ($.state.done.includes(player.id)) return;

  const stateTask = $.state.stateTask;
  const counts = stateTask[player.id] ? [...stateTask[player.id]] : ChairPoses.map(() => 0);

  if (counts[chairPos] >= 1) return; // そのchairPosはもう置いてある
  counts[chairPos] += 1;
  stateTask[player.id] = counts;
  $.state.stateTask = stateTask;

  if (counts.every(c => c >= 1)) {
    $.state.done = [...$.state.done, player.id];
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}