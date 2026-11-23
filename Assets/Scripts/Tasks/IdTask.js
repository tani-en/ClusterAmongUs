const TASK_ID = "cipher";



$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "Enter":
      if(arg.player.userId === arg.text){
        $.worldItemReference("gameManager").send("taskStep", {
          taskId: TASK_ID,
          player: arg.player
        });
      }
      break;
  }
});