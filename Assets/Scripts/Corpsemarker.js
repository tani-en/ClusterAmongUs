const HIDDEN_POSITION = new Vector3(0, -100, 0);
const VICTIMNAME = $.subNode("victimName");

$.onStart(() => {
  $.state.corpseId = null;
  $.state.corpseName = "";
  VICTIMNAME.setText("");
  $.setPosition(HIDDEN_POSITION);
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "setCorpse": // from GM. arg.id: victimのId, arg.name: victimのuserDisplayName, arg.pos: victimのpos
      $.state.corpseId = arg.id;
      $.state.corpseName = arg.name;
      VICTIMNAME.setText(arg.name);
      $.setPosition(arg.pos);
      break;

    case "hideCorpse": // ゲーム終了時、meeting開始時に呼ばれる
      hideCorpse();
      break;
  }
});

$.onInteract(player => {
  if ($.state.corpseId === null) return;
  $.worldItemReference("gameManager").send("reportCorpse", {
    corpseId: $.state.corpseId,
    reporter: player
  });

  hideCorpse();
});

function hideCorpse(){
  $.state.corpseId = null;
  $.state.corpseName = "";
  VICTIMNAME.setText("");
  $.setPosition(HIDDEN_POSITION);
}