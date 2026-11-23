const MEETING_ROOM_POSITION = new Vector3(0,3,-10)
const Bt_HIDDEN_POSITION = new Vector3(0, 100, 0);
const Bt_POSITION = new Vector3(2,20.21,6)

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
    player.setPosition(MEETING_ROOM_POSITION);
  }
});