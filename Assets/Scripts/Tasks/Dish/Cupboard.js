const MAX_DISH = 6;
const TASK_ID = "dish";
const STEP = 0;

const DishPoses    = [$.worldItemReference("dishPos"), $.worldItemReference("dishPos1"), $.worldItemReference("dishPos2"), $.worldItemReference("dishPos3"), $.worldItemReference("dishPos4"), $.worldItemReference("dishPos5")];
const DISHTEMPLATE = new WorldItemTemplateId("dish");


$.onStart(() => {
  $.state.Dish     = [];
  $.state.stateTask = {}; // { プレイヤーID: [ボイラー0に入れた数, ボイラー1, ボイラー2] }
  $.state.done = [];      // タスクを終えたプレイヤーのid
});


$.onInteract(() => {
  let Dish =  $.state.Dish.filter(dish => dish.exists());
  if (Dish.length < MAX_DISH){
    const markerPosition = $.getPosition();
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    const dishHandle = $.createItem(DISHTEMPLATE, markerPosition, markerRotation);
    Dish.push(dishHandle);
    dishHandle.send("dishPoses", DishPoses);
  }
  $.state.Dish = Dish;
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteDish": { // from Dish.js. arg: { player, dishPos: dishPosの番号 }
      let Dish = $.state.Dish;
      if (!(sender instanceof ItemHandle)) break;
      if (!Dish.some(dish => dish.id === sender.id)) break;
      Dish = Dish.filter(dish => dish.id != sender.id);
      $.state.Dish = Dish;
      if (arg && arg.player) taskProgress(arg.player, arg.dishPos);
      break;
    }

    case "start":
      DishPoses.forEach(pos => pos.send("start", null)); // 置いてあるお皿の表示を戻す
      $.state.Dish.forEach(dish => {
        if (dish.exists()) dish.send("start", null);
      });
      $.state.Dish     = [];
      $.state.stateTask = {};
      $.state.done = [];
      break;
  }
});


function taskProgress(player, dishPos){
  if (!Number.isInteger(dishPos) || dishPos < 0 || dishPos >= DishPoses.length) return;
  if ($.state.done.includes(player.id)) return;

  const stateTask = $.state.stateTask;
  const counts = stateTask[player.id] ? [...stateTask[player.id]] : DishPoses.map(() => 0);

  if (counts[dishPos] >= 1) return; // そのdishPosはもう置いてある
  counts[dishPos] += 1;
  stateTask[player.id] = counts;
  $.state.stateTask = stateTask;

  if (counts.every(c => c >= 1)) {
    $.state.done = [...$.state.done, player.id];
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      step: STEP,
      player: player
    });
  }
}