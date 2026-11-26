const MAXTEMPLATE = 5;
const TASK_STEPS = 2;
const TASK_ID = "sheet";

// ベッドは BedMaker が作り直すので、一覧は BedMaker から "bedHd" で受け取る($.state.beds)
const SHEETTEMPLATE = new WorldItemTemplateId("sheet");


$.onStart(() => {
  $.state.beds = [];
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
    sheetHandle.send("beds", $.state.beds);
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

    case "bedHd": { // from BedMaker. arg: 新しいベッドのハンドルの一覧
      $.state.beds = arg;
      for (const sheet of $.state.sheets) {
        if (sheet.exists()) sheet.send("beds", arg); // すでに出ているシーツにも、新しい一覧を教える
      }
      break;
    }

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