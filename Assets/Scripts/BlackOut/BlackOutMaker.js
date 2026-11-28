const BLACKOUT = new WorldItemTemplateId("blackOut");
// 筒を立てるための基本の向き(X軸まわりに -90 度)。BlackOut.js の BASE_ROT と同じ値にする。
const BASE_ROT = Quaternion(-0.707106829, 0, 0, 0.707106829);
const CREATE_INTERVAL = 0.1; // 暗幕を1つ作る間隔(秒)

$.onStart(() => {
  $.state.blackOuts = [];  // 作った暗幕 { id: プレイヤーID, handle: 暗幕のハンドル }
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

    case "blackOutRemove": { // arg: 死亡(キル・追放)したプレイヤー。そのプレイヤーの暗幕だけを消す
      if (!arg) break;
      for (const bo of $.state.blackOuts) {
        if (bo.id === arg.id) bo.handle.send("blackOutFinish", null);
      }
      $.state.blackOuts = $.state.blackOuts.filter(bo => bo.id !== arg.id);
      $.state.queue = $.state.queue.filter(p => p.id !== arg.id); // まだ作っていない分も取り消す
      break;
    }
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
  const handle = $.createItem(BLACKOUT, pos, BASE_ROT);
  handle.send("playerHd", p);
  $.state.blackOuts = [...$.state.blackOuts, { id: p.id, handle: handle }];
});

function finishAll() {
  for (const bo of $.state.blackOuts) bo.handle.send("blackOutFinish", null);
  $.state.blackOuts = [];
  $.state.queue = [];
}