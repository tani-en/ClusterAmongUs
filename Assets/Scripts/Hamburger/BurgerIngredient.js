// ハンバーガーの材料(パティ・チーズ・キャベツ・トマト・上のパン)。5種類とも、同じスクリプトでよい。
// アイテムには、Grabbable Item、Rigidbody、Collider が必要。
// 種類は、出した箱(BurgerBox.js)が "init" で教えてくれる。
// 土台(BurgerBase.js。複数あってよい)のどれかに当たると、種類と、最後に持っていたプレイヤーを知らせて、自分は消える。

const DELETETIME = 60; // 生成されてから自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.type = null;    // 材料の種類
  $.state.bases = null;   // 土台のアイテムの一覧
  $.state.player = null;  // 最後に持ったプレイヤー
  $.state.elapsed = 0;    // 持たれていない間の経過秒数
  $.state.grab = false;
});

$.onGrab((isGrab, isLeftHand, player) => {
  $.state.grab = isGrab;
  if (isGrab) {
    $.state.player = player;
  }
});

$.onCollide(collision => {
  const h = collision.handle;
  const bases = $.state.bases;
  if (!h || !bases || h.type !== "item") return;
  if (!bases.some(base => base.id === h.id)) return; // 当たったのが、土台のどれかか
  if (!$.state.player || !$.state.type) return;

  h.send("place", { type: $.state.type, player: $.state.player });
  $.destroy();
});

// DELETETIMEが経ったら消す。持たれている間は時間を数えない。
$.onUpdate(deltaTime => {
  if ($.state.grab) return;
  $.state.elapsed += deltaTime;
  if ($.state.elapsed >= DELETETIME) {
    $.destroy();
  }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "init": // from BurgerBox
      $.state.type = arg.type;
      $.state.bases = arg.bases;
      break;

    case "start":
      $.destroy();
      break;
  }
});