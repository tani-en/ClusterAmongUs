$.onInteract(player => {
  $.worldItemReference("gameManager").send("requestVent", player);
});


$.onReceive((messageType, arg, sender) => {
  switch(messageType){
    case "ventUse": // from GM. arg: インタラクトしたプレイヤーのHd
      const pos = $.getPosition();
      arg.setPosition(new Vector3(pos.x, pos.y - 2, pos.z));
      break;
  }
});