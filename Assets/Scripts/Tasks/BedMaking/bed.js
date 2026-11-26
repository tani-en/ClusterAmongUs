// ベッド。BedMaker.js が createItem で作る(テンプレート "bed")。
// 会議が始まると、BedMaker から "meetingStart" が届く → 乗っている人を BedMaker に知らせて、自分を消す。
// (消えると、乗っていた人は降りる。会議室へ動かすのは BedMaker が担当する)
//
// 作られたあと、すぐに BedMaker から "init" が届く(gameManager のハンドルと、BedMaker 自身を覚える)。
// 作られたアイテムでは World Item Reference List が使えないことがあるので、必要な相手は "init" で教えてもらう。

const BEDCLEAN = $.subNode("BedClean");
const BEDEMPTY  = $.subNode("BedEmpty");

const TASK_ID = "sleep";
const SLEEPTIME = 30;

const CLEANTIME = 5;

function setBedLit(lit) {
  BEDCLEAN.setEnabled(lit);
  BEDEMPTY.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setBedLit(false);

  $.state.isSleep = false;
  $.state.player = null;
  $.state.sleepTime = 0;
  // $.state.maker / $.state.gm は、"init" で入れるので、ここでは触らない
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "init": // from BedMaker. arg.gm: gameManager のハンドル
      $.state.maker = sender;
      $.state.gm = arg ? arg.gm : null;
      break;

    case "Sheet": // from Sheet
      $.state.time = 0;
      $.state.lit = true;
      setBedLit(true);
      break;

    case "meetingStart": { // from BedMaker
      const maker = $.state.maker;
      if (maker) maker.send("bedGone", { player: $.state.player }); // 乗っている人(いなければ null)
      $.destroy();
      break;
    }
  }
});

$.onRide((isGetOn, player) => {
  $.state.isSleep = isGetOn;
  $.state.player = isGetOn ? player : null;
  $.state.sleepTime = 0;
});


$.onUpdate(deltaTime => {
  let t = $.state.time ?? 0;
  t += deltaTime;
  if (t > CLEANTIME) {
    t -= CLEANTIME;
    $.state.lit = false;
    setBedLit(false);
  }
  $.state.time = t;

  if (!$.state.isSleep) return;
  let sleept = $.state.sleepTime ?? 0;
  sleept += deltaTime;
  if (sleept > SLEEPTIME) {
    sleept -= SLEEPTIME;
    const gm = $.state.gm;
    if (gm && $.state.player) gm.send("taskStep", { taskId: TASK_ID, player: $.state.player });
  }
  $.state.sleepTime = sleept;
});