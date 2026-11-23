const BEDCLEAN = $.subNode("BedClean");
const BEDMESSY  = $.subNode("BedMessy");

const CLEANTIME = 5;

function setBedLit(lit) {
  BEDCLEAN.setEnabled(lit);
  BEDMESSY.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setBedLit(false);
});


$.onInteract(player => {
  if($.state.lit) return;
  $.state.time = 0;
  $.state.lit = true;
  setBedLit(true);
  $.worldItemReference("bedAndLight").send("interact", {player: player});
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