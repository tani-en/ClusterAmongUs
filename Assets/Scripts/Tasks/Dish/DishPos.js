const DISH            = $.subNode("dish");
const DISHTRANSPARENT = $.subNode("dishTransparent");


const PUTTIME = 30;

function setDishLit(lit) {
  DISH.setEnabled(lit);
  DISHTRANSPARENT.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setDishLit(false);
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "putDish":
      $.state.time = 0;
      $.state.lit = true;
      setDishLit(true);
      break;

    case "start": // from Cupboard: 新しいゲーム
      $.state.time = 0;
      $.state.lit = false;
      setDishLit(false);
      break;
  }
});


$.onUpdate(deltaTime => {
    let t = $.state.time ?? 0;
    t += deltaTime;
    if (t > PUTTIME) {
        t -= PUTTIME;
        $.state.lit = false;
        setDishLit(false);
    }
    $.state.time = t;
});