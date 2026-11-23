const DELETETIME = 60; // 生成されてからbookを自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.beds = null;
  $.state.sheetDrawer    = null;
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
  if (h && $.state.beds && h.type === "item" && $.state.beds.some(bed => bed.id === h.id)) {
    if (!$.state.player) return;
    $.state.sheetDrawer.send("deleteSheet", {player: $.state.player});
    h.send("Sheet", null);
    $.destroy();
  }
});

// DELETETIMEが経ったらbookを消す。持たれている間は時間を数えない。
// 本棚に入れたときとは違い、BooksMessyへ"deleteBook"は送らないので、タスクの進捗には数えない。
// (BooksMessy側のBooksリストは、次回interact時にexists()で自動的に取り除かれる)
$.onUpdate(deltaTime => {
  if ($.state.grab) return;
  $.state.elapsed += deltaTime;
  if ($.state.elapsed >= DELETETIME) {
    $.destroy();
  }
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "beds":
      $.state.beds = arg;
      $.state.sheetDrawer = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});