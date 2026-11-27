const BLACKOUT = new WorldItemTemplateId("blackOut");
const CREATE_INTERVAL = 0.1; // 暗幕を1つ作る間隔(秒)

$.onStart(() => {
  $.state.blackOuts = [];  // 作った暗幕のハンドル
  $.state.queue = [];      // まだ作っていないプレイヤー
  $.state.wait = 0;
});

$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "blackOutStart":
      finishAll(); // すでにある暗幕は、先に消す(二重に作らない)
      $.state.queue = Array.isArray(arg) ? [...arg] : [];
      $.state.wait = 0;
      break;

    case "blackOutFinish":
      finishAll();
      break;
  }
});

$.onUpdate(deltaTime => {
  const queue = $.state.queue;
  if (queue.length === 0) return;
  const wait = $.state.wait - deltaTime;
  if (wait > 0) { $.state.wait = wait; return; }

  const p = queue.shift();
  $.state.queue = queue;
  $.state.wait = CREATE_INTERVAL;
  if (!p || !p.exists()) return;

  const pos = p.getPosition() ?? $.getPosition();
  const handle = $.createItem(BLACKOUT, pos, $.getRotation());
  handle.send("playerHd", p);
  $.state.blackOuts = [...$.state.blackOuts, handle];
});

function finishAll() {
  for (const bo of $.state.blackOuts) bo.send("blackOutFinish", null);
  $.state.blackOuts = [];
  $.state.queue = [];
}