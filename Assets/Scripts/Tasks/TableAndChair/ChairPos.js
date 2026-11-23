const Chair            = $.subNode("Chair");
const ChairTRANSPARENT = $.subNode("ChairTransarent");


const PUTTIME = 30;

function setChairLit(lit) {
  Chair.setEnabled(lit);
  ChairTRANSPARENT.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setChairLit(false);
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "putChair":
      $.state.time = 0;
      $.state.lit = true;
      setChairLit(true);
      break;

    case "start": // from : Chairs 新しいゲーム
      $.state.time = 0;
      $.state.lit = false;
      setChairLit(false);
      break;
  }
});


$.onUpdate(deltaTime => {
    let t = $.state.time ?? 0;
    t += deltaTime;
    if (t > PUTTIME) {
        t -= PUTTIME;
        $.state.lit = false;
        setChairLit(false);
    }
    $.state.time = t;
});