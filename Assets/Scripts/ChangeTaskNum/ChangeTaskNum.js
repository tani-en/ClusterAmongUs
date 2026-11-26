const MAX_TASKS = 17;
const TEXTVIEW = $.subNode("Text");

$.onStart(() => {
  $.state.taskNum = 6;
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "Change":
      let taskNum = $.state.taskNum;
      taskNum += arg;
      if(taskNum > MAX_TASKS) taskNum = MAX_TASKS;
      if(taskNum < 1)         taskNum = 1;
      $.state.taskNum = taskNum;
      $.worldItemReference("gameManager").send("changeTaskNum", taskNum);
      TEXTVIEW.setText("タスクの数:" + taskNum);
      break;
  }
});
