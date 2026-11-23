const DELETETIME = 60; // 生成されてからcoalを自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.dishPoses = null;
  $.state.cupboard    = null;
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
  const dishPoses = $.state.dishPoses;
  if (!h || !dishPoses || h.type !== "item") return;
  const index = dishPoses.findIndex(d => d.id === h.id);
  if (index === -1) return;

  if (!$.state.player) return;

  h.send("putDish", null);
  $.state.cupboard.send("deleteDish", { player: $.state.player, dishPos: index }); // Cupboard.js は { player, dishPos } を受け取る
  $.destroy();
});


$.onUpdate(deltaTime => {
  if ($.state.grab) return;
  $.state.elapsed += deltaTime;
  if ($.state.elapsed >= DELETETIME) {
    $.destroy();
  }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "dishPoses":
      $.state.dishPoses = arg;
      $.state.cupboard = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});