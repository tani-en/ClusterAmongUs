const WAITING_ROOM_POSITION = new Vector3(0, 20, 5);
const Bt_HIDDEN_POSITION = new Vector3(0, 100, 0);
const Bt_POSITION = new Vector3(0, -9, 3);


$.onStart(() => {
  $.state.phase = "lobby";
});

$.onReceive((messageType, arg, sender) => {
  switch(messageType){
    case "phase": // from GM.
      $.state.phase = arg;

      if(arg === "lobby") $.setPosition(Bt_POSITION);
      if(arg === "playing") $.setPosition(Bt_HIDDEN_POSITION);
      break;
  }
});

$.onInteract(player => {
  if($.state.phase === "lobby"){
  player.setPosition(WAITING_ROOM_POSITION);
  }
});


