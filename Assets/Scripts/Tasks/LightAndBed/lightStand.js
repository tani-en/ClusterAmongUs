const LIGHTSTANDLIGHT = $.subNode("standLight_light");
const LIGHTSTANDDARK  = $.subNode("standLight_dark");

const LIGHTTIME = 5;

function setLightStandLit(lit) {
  LIGHTSTANDLIGHT.setEnabled(lit);
  LIGHTSTANDDARK.setEnabled(!lit);
}

$.onStart(() => {
  $.state.time = 0;
  $.state.lit = false;
  setLightStandLit(false);
});


$.onInteract(player => {
  if($.state.lit) return;
  $.state.time = 0;
  $.state.lit = true;
  setLightStandLit(true);
  $.worldItemReference("bedAndLight").send("interact", {player: player});
});


$.onUpdate(deltaTime => {
    let t = $.state.time ?? 0;
    t += deltaTime;
    if (t > LIGHTTIME) {
        t -= LIGHTTIME;
        $.state.lit = false;
        setLightStandLit(false);
    }
    $.state.time = t;
});