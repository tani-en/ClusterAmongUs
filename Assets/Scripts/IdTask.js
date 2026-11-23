const TASK_ID = "cipher";
const STEP = 0;



$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "Enter":
      if(arg.player.userId === arg.text){
        $.worldItemReference("gameManager").send("taskStep", {
          taskId: TASK_ID,
          step: STEP,
          player: arg.player
        });
      }
      break;
  }
});