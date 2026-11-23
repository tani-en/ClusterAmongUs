const MAXTEMPLATE = 5;
const TASK_STEPS = 2;
const TASK_ID = "sheet"; // GameManager.js の TASK_DEFS の id

const BEDS = [$.worldItemReference("bed"), $.worldItemReference("bed1")];
const SHEETTEMPLATE = new WorldItemTemplateId("sheet");


$.onStart(() => {
  $.state.sheets     = [];
  $.state.stateTask = {};
});


$.onInteract(() => {

  let sheets =  $.state.sheets.filter(sheet => sheet.exists());
  if (sheets.length < MAXTEMPLATE){
    const markerPosition = $.getPosition();
    markerPosition.y += 3;

    const markerRotation = $.getRotation();

    const sheetHandle = $.createItem(SHEETTEMPLATE, markerPosition, markerRotation);
    sheets.push(sheetHandle);
    sheetHandle.send("beds", BEDS);
    $.state.sheets = sheets;
  }

});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "deleteSheet":
      let sheets = $.state.sheets;
      if (!sheets.some(sheet => sheet.id === sender.id)) break;
      sheets = sheets.filter(sheet => sheet.id != sender.id);
      $.state.sheets = sheets;
      if (arg && arg.player) taskProgress(arg.player); 
      break;
    
    case "start":
      $.state.sheets.forEach(sheet => {
        sheet.send("start", null);
      });
      $.state.sheets     = [];
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

  $.log(stateTask[player.id])
  if (stateTask[player.id] === TASK_STEPS){
    $.worldItemReference("gameManager").send("taskStep", {
      taskId: TASK_ID,
      player: player
    });
  }
}