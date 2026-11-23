const DELETETIME = 60; // 生成されてからcoalを自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.chairPoses = null;
  $.state.chairs    = null;
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
  const chairPoses = $.state.chairPoses;
  if (!h || !chairPoses || h.type !== "item") return;
  const index = chairPoses.findIndex(d => d.id === h.id);
  if (index === -1) return;

  if (!$.state.player) return;

  h.send("putChair", null);
  $.state.chairs.send("deleteChair", { player: $.state.player, chairPos: index });
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
    case "chairPoses":
      $.state.chairPoses = arg;
      $.state.chairs = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});