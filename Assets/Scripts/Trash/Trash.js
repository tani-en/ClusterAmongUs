const DELETETIME = 60; // 生成されてからbookを自動で消すまでの秒数(持っている間は数えない)

$.onStart(() => {
  $.state.trashRoom = null;
  $.state.trashBox    = null;
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
  if (h && $.state.trashRoom && h.type === "item" && h.id === $.state.trashRoom.id) {
    if (!$.state.player) return;
    $.state.trashBox.send("deleteTrash", {player: $.state.player});
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
    case "trashRoom": // from TrashBox. arg.trashRoom: trashRoomのHd
      $.state.trashRoom = arg;
      $.state.trashBox = sender;
      break;

    case "start":
      $.destroy();
      break;
  }
});