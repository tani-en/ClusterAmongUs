const DELETETIME = 60; // 生成されてからcoalを自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.boiers = null;    // CoalBoxが教えてくれる、ボイラーの一覧
  $.state.coalBox    = null;
  $.state.player       = null;
  $.state.elapsed      = 0;     // 持たれていない間の経過秒数
  $.state.grab  = false;
});

$.onGrab((isGrab, isLeftHand, player) => {
  $.state.grab = isGrab;

  if (isGrab) {
    $.state.player = player;
  }
});

$.onCollide(collision => {
  const h = collision.handle;
  const boilers = $.state.boiers;
  if (!h || !boilers || h.type !== "item") return;

  // 当たったのが、何番目のボイラーか(ボイラー以外なら何もしない)
  const index = boilers.findIndex(b => b.id === h.id);
  if (index === -1) return;
  if (!$.state.player) return;

  $.state.coalBox.send("deleteCoal", { player: $.state.player, boiler: index });
  $.destroy();
});

// DELETETIMEが経ったらcoalを消す。持たれている間は時間を数えない。
// ボイラーに入れたときとは違い、CoalBoxへ"deleteCoal"は送らないので、タスクの進捗には数えない。
// (CoalBox側のCoalリストは、次回interact時にexists()で自動的に取り除かれる)
$.onUpdate(deltaTime => {
  if ($.state.grab) return;
  $.state.elapsed += deltaTime;
  if ($.state.elapsed >= DELETETIME) {
    $.destroy();
  }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "boiers":
      $.state.boiers = arg;
      $.state.coalBox = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});