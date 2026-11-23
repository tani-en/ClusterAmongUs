const TASK_STEPS = 5;
const TASK_ID = "laundry"; // GameManager.js の TASK_DEFS の id

const DRAWERS    = [$.worldItemReference("drawer"), $.worldItemReference("drawer1"), $.worldItemReference("drawer2"), $.worldItemReference("drawer3"), $.worldItemReference("drawer4")];
const DRAWERPOSES = [Vector3(19, 0, 5.3), Vector3(-29.2, 0, -8.2), Vector3(-17, 0, -19.7), Vector3(18.3, 0, -22.7), Vector3(22, 0, -13.5)];
const CLOTHTEMPLATE = new WorldItemTemplateId("cloth");


$.onStart(() => {
  $.state.clothes     = [];
  $.state.stateTask = {};
});


$.onInteract(() => {

  let clothes =  $.state.clothes.filter(cloth => cloth.exists());
  if (clothes.length < TASK_STEPS){
    const markerPosition = $.getPosition();
    markerPosition.x += 2;
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    let where = Math.floor(Math.random() * 5);
    const DRAWER    = DRAWERS[where];
    const DRAWERPOS = DRAWERPOSES[where];

    const clothHandle = $.createItem(CLOTHTEMPLATE, markerPosition, markerRotation);
    clothes.push(clothHandle);
    clothHandle.send("drawer", {drawer: DRAWER, pos: DRAWERPOS});
    $.state.clothes = clothes;
  }

});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteCloth":
      let clothes = $.state.clothes;
      if (!clothes.some(cloth => cloth.id === sender.id)) break;
      clothes = clothes.filter(cloth => cloth.id != sender.id);
      $.state.clothes = clothes;
      if (arg && arg.player) taskProgress(arg.player); 
      break;
    
    case "start":
      $.state.clothes.forEach(cloth => {
        cloth.send("start", null);
      });
      $.state.clothes     = [];
      $.state.stateTask = {};
      break;

  }
});


function taskProgress(player){
  let stateTask = $.state.stateTask;

  if (player.id in stateTask) {
    stateTask[player.id] += 1; 
  } else {
    stateTask[player.id] = 1;
  }
  $.state.stateTask = stateTask;

  if (stateTask[player.id] === TASK_STEPS){
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}