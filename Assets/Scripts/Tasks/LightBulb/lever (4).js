const leverHandle = $.subNode("lever_handle");

$.onStart(() => {
  $.state.rotUp = false;
});

$.onInteract((player) => {
  $.worldItemReference("lightBulb").send("lever", {lever: 4, player: player});
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "result": {
      let rotUp = $.state.rotUp;
      if(rotUp) {
        leverHandle.setRotation(new Quaternion(-0.173648253,0,0,0.984807789));
        $.state.rotUp = !rotUp;
      }else{
        leverHandle.setRotation(new Quaternion(-0.984807789,0,0,0.173648253));
        $.state.rotUp = !rotUp;   
      }
      break;
    }
  }
});