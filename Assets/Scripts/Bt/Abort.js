const TEXTVIEW = $.subNode("Text");

$.onStart(() => {
  $.state.participantsNum = null;
  $.state.approved = [];
  TEXTVIEW.setText("中断用\n不用意に押さないこと");
});

$.onInteract((player) => {
  if(!$.state.participantsNum) return;
  let approved = $.state.approved;

  if (!approved.includes(player)) {
    approved.push(player);
    let text = approved.map(player => player.userDisplayName).join("\n");
    TEXTVIEW.setText("中断用\n不用意に押さないこと\n" + text + "\nが中止に同意");
  }

  if (approved.length > $.state.participantsNum / 2) {
    $.worldItemReference("gameManager").send("abort", null);
  }

  $.state.approved = approved;
});

$.onReceive((messageType, arg) => {
  switch (messageType) {
    case "start": // from GameManager. arg: 参加者の数
      $.state.participantsNum = arg;
      $.state.approved = [];
      TEXTVIEW.setText("中断用\n不用意に押さないこと");
      break;
  }
});