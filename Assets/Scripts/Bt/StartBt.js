const UNTILSTARTTIME = 10;
const WAITING_ROOM_POSITION = new Vector3(0, 20, 5);
const TEXTVIEW = $.subNode("Text");
const GAMEMANAGER = $.worldItemReference("gameManager");

$.onStart(() => {
  $.state.canStart = false;  // 開始できる人数がそろっている
  $.state.counting = false;  // カウントダウン中か
  $.state.timer = UNTILSTARTTIME;
  showIdleText();
});


$.onInteract(() => {
  if (!$.state.canStart) return;

  $.state.counting = true;

  // 探索中のplayerは全員戻す
  const allPlayers = $.getPlayersNear($.getPosition(), Infinity);
  for (const p of allPlayers) {
    if (p.getPosition().y < 9) {
      p.setPosition(WAITING_ROOM_POSITION);
    }
  }
});


$.onUpdate(deltaTime => {
  if (!$.state.counting) return;

  const timer = $.state.timer - deltaTime;
  if (timer <= 0) {
    $.state.counting = false;
    $.state.timer = UNTILSTARTTIME;;
    GAMEMANAGER.send("start", null);
    TEXTVIEW.setText("");
    return;
  }
  $.state.timer = timer;
  TEXTVIEW.setText(Math.ceil(timer) + "秒で開始");
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "canStart": // from GameManager. arg: true/false
      $.state.canStart = arg === true;
      if (!$.state.canStart) $.state.counting = false; // 人数が足りなくなったら、カウントダウンを止める
      if (!$.state.counting) showIdleText();
      break;
  }
});


function showIdleText() {
  TEXTVIEW.setText($.state.canStart ? "押して開始" : "人数が足りません");
}