const DELETETIME = 60; // 生成されてからbookを自動で消すまでの秒数(持っている間は数えない)
const ARROW = $.subNode("arrow");

$.onStart(() => {
  $.state.drawer = null;
  $.state.pos    = new Vector3(0, 0, 0);
  $.state.pale    = null;
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
  if (h && $.state.drawer && h.type === "item" && h.id === $.state.drawer.id) {
    if (!$.state.player) return;
    $.state.pale.send("deleteCloth", {player: $.state.player});
    $.destroy();
  }
});


function updateArrow() {
  if (!$.state.drawer) return;

  const arrowPos = ARROW.getGlobalPosition();
  if (!arrowPos) return;

  // グローバル座標での「ARROWから目標へ」の向き
  const direction = $.state.pos.clone().sub(arrowPos);
  if (direction.lengthSq() < 0.0001) return; // ほぼ同じ位置なら向きが定まらない

  // SubNode.setRotationはアイテムのローカル座標で指定するため、
  // アイテム自身の回転の逆回転で、向きと上方向をローカル座標に変換する
  const inverseItemRotation = $.getRotation().clone().invert();
  const localDirection = direction.applyQuaternion(inverseItemRotation);
  const localUp = new Vector3(0, 1, 0).applyQuaternion(inverseItemRotation); // ワールドの上方向を保つ

  ARROW.setRotation(Quaternion.lookRotation(localDirection, localUp));
}


$.onUpdate(deltaTime => {
  updateArrow();

  if ($.state.grab) return;
  $.state.elapsed += deltaTime;
  if ($.state.elapsed >= DELETETIME) {
    $.destroy();
  }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "drawer":
      $.state.drawer = arg.drawer;
      $.state.pos = arg.pos;
      $.state.pale = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});