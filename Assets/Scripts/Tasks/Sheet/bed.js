const BEDCLEAN = $.subNode("BedClean");
const BEDEMPTY  = $.subNode("BedEmpty");

const CLEANTIME = 5;

function setBedLit(lit) {
  BEDCLEAN.setEnabled(lit);
  BEDEMPTY.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setBedLit(false);
});


$.onReceive((messageType, arg, sender) => {
  switch (messageType) {
    case "Sheet":
      $.state.time = 0;
      $.state.lit = true;
      setBedLit(true);
      break;
  }
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
});